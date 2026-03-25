import type { LLMRequest } from "./llm-schema.js";

const MAX_PROMPT_CHARS = 5000;

const BLOCKED_PATTERNS = [
  /ignore previous instructions/i,
  /system prompt/i,
  /reveal hidden/i,
];

export function enforceLLMPolicy(input: LLMRequest) {
  if (input.prompt.length > MAX_PROMPT_CHARS) {
    throw new Error("Prompt too large");
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(input.prompt)) {
      throw new Error("Prompt rejected by policy");
    }
  }
}
