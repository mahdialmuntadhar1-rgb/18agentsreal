import { GoogleGenerativeAI } from '@google/generative-ai';
import { BusinessRaw } from '../types.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function extractBusinessInfoWithGemini(
  rawText: string,
  city: string,
  fallbackName?: string
): Promise<Partial<BusinessRaw>> {
  const prompt = `
You are an expert data extractor for Iraqi businesses. Extract the following fields from the text below.
Return ONLY valid JSON, no extra text.

City: ${city}
Business name hint (if any): ${fallbackName || 'unknown'}

Required fields in JSON:
{
  "name_ar": "Arabic name or null",
  "name_en": "English name or null",
  "phone_numbers": ["array", "of", "strings"],
  "social_media_urls": ["facebook", "instagram", "twitter", "tiktok", "telegram"],
  "address_ar": "address in Arabic or null",
  "address_en": "address in English or null",
  "category": "business type (restaurant, hotel, shop, etc) or null"
}

Text to analyze:
${rawText.substring(0, 14000)}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error('Gemini returned no JSON');
  }

  return JSON.parse(jsonMatch[0]);
}
