import { randomUUID } from "node:crypto";
import { Router } from "express";
import { enforceLLMPolicy } from "./llm-policy.js";
import { validateLLMRequest } from "./llm-schema.js";
import { runLLMTask } from "./llm-service.js";

export const llmRouter = Router();

llmRouter.post("/run", async (req, res) => {
  const requestId = randomUUID();
  const userId = String(req.headers["x-authenticated-user-id"] ?? "unknown");
  const role = String(req.headers["x-auth-role"] ?? "user");

  if (!["admin", "operator"].includes(role)) {
    console.warn(`[LLM_DENIED] requestId=${requestId} userId=${userId} role=${role}`);
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  try {
    const validated = validateLLMRequest(req.body);
    enforceLLMPolicy(validated);

    const text = await runLLMTask(validated);

    console.info(
      `[LLM_OK] requestId=${requestId} userId=${userId} role=${role} taskType=${validated.taskType} promptChars=${validated.prompt.length}`
    );

    res.json({ success: true, data: { text } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    console.warn(`[LLM_FAIL] requestId=${requestId} userId=${userId} message=${message}`);
    res.status(400).json({ error: message, requestId });
  }
});
