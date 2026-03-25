import { GoogleGenAI } from "@google/genai";
import type { LLMRequest } from "./llm-schema.js";

const MODEL = "gemini-2.0-flash";
const MAX_OUTPUT_TOKENS = 2048;
const TIMEOUT_MS = 15_000;

function getSystemInstruction(taskType: LLMRequest["taskType"]) {
  if (taskType === "supervisor-chat") {
    return "You are a professional, efficient AI Supervisor for the Iraq Compass project. You speak with authority and technical precision. Keep responses concise but helpful.";
  }

  return "You are an Iraq Compass specialist assistant. Produce factual, concise responses and avoid hallucinated claims.";
}

export async function runLLMTask(input: LLMRequest): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("LLM not configured");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await Promise.race([
      ai.models.generateContent({
        model: MODEL,
        contents: [{ role: "user", parts: [{ text: input.prompt }] }],
        config: {
          systemInstruction: getSystemInstruction(input.taskType),
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("LLM request timed out")), TIMEOUT_MS);
      }),
    ]);

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Empty LLM response");
    }

    return text;
  } catch (error) {
    throw error;
  }
}
