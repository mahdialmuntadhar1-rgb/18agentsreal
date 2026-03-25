export type LLMTaskType = "agent-run" | "supervisor-chat";

export type LLMRequest = {
  taskType: LLMTaskType;
  prompt: string;
};

const ALLOWED_TASK_TYPES: Set<LLMTaskType> = new Set(["agent-run", "supervisor-chat"]);

export function validateLLMRequest(body: unknown): LLMRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid LLM request");
  }

  const payload = body as Record<string, unknown>;
  const taskType = payload.taskType;
  const prompt = payload.prompt;

  if (typeof taskType !== "string" || !ALLOWED_TASK_TYPES.has(taskType as LLMTaskType)) {
    throw new Error("Invalid taskType");
  }

  if (typeof prompt !== "string") {
    throw new Error("Invalid LLM request");
  }

  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    throw new Error("Prompt is required");
  }

  return {
    taskType: taskType as LLMTaskType,
    prompt: trimmedPrompt,
  };
}
