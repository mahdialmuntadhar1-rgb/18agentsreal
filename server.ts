import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { runGovernor } from "./server/governors/index.js";
import { supabaseAdmin } from "./server/supabase-admin.js";

dotenv.config();

type GeminiPart = { text: string };
type GeminiMessage = { role: "user" | "model"; parts: GeminiPart[] };

const PORT = Number(process.env.PORT ?? 3000);

function isAuthorizedAdmin(req: express.Request): boolean {
  const expected = process.env.ADMIN_SHARED_SECRET;
  if (!expected) return true;
  return req.header("x-admin-secret") === expected;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/agents", async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from("agents")
      .select("id,display_name,city,category,status,status_reason,last_run_at,updated_at")
      .order("id");

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? []);
  });

  app.post("/api/agents/:agentName/run", async (req, res) => {
    if (!isAuthorizedAdmin(req)) return res.status(401).json({ error: "unauthorized" });

    try {
      const { agentName } = req.params;
      void runGovernor(agentName);
      return res.json({ status: "started", agentName });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start agent";
      return res.status(500).json({ error: message });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });

    const { model = "gemini-2.0-flash", systemInstruction, contents, tools } = req.body as {
      model?: string;
      systemInstruction?: string;
      contents?: GeminiMessage[];
      tools?: unknown[];
    };

    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: "contents is required and must be a non-empty array." });
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
            ...(Array.isArray(tools) && tools.length > 0 ? { tools } : {}),
          }),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();
        return res.status(response.status).json({ error: errorBody || "Gemini request failed." });
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const text =
        data.candidates?.[0]?.content?.parts
          ?.map((part) => part.text)
          .filter((part): part is string => Boolean(part))
          .join("\n") ?? "";

      return res.json({ text, raw: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected server error.";
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

void startServer();
