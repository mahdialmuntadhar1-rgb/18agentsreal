import express from "express";
import { createServer as createViteServer } from "vite";
import { runGovernor } from "./server/governors/index.js";
import { supabaseAdmin } from "./server/supabase-admin.js";

type GeminiPart = { text: string };
type GeminiMessage = { role: "user" | "model"; parts: GeminiPart[] };

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/agents", async (_req, res) => {
    const { data, error } = await supabaseAdmin.from("agents").select("*").order("id");
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data ?? []);
  });

  app.post("/api/agents/:agentName/run", async (req, res) => {
    const { agentName } = req.params;
    try {
      runGovernor(agentName).catch(console.error);
      res.json({ status: "started", agentName });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
      return;
    }

    const {
      model = "gemini-2.0-flash",
      systemInstruction,
      contents,
      tools,
    } = req.body as {
      model?: string;
      systemInstruction?: string;
      contents?: GeminiMessage[];
      tools?: unknown[];
    };

    if (!Array.isArray(contents) || contents.length === 0) {
      res.status(400).json({ error: "contents is required and must be a non-empty array." });
      return;
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents,
            ...(systemInstruction
              ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
              : {}),
            ...(Array.isArray(tools) && tools.length > 0 ? { tools } : {}),
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        res.status(response.status).json({ error: errorBody || "Gemini request failed." });
        return;
      }

      const data = (await response.json()) as any;
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((part: any) => part?.text)
          ?.filter(Boolean)
          ?.join("\n") ?? "";

      res.json({ text, raw: data });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Unexpected server error." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
