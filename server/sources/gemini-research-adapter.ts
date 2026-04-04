import { BaseSourceAdapter, BusinessData, SearchQuery } from './base-adapter.ts';
import { GoogleGenAI } from '@google/genai';

interface GeminiBusinessResult {
  name: string;
  name_ar?: string;
  address: string;
  city: string;
  phone?: string;
  website?: string;
  rating?: number;
  review_count?: number;
  hours?: string;
  category: string;
  description?: string;
  source_url?: string;
  confidence: number;
}

export class GeminiResearchAdapter extends BaseSourceAdapter {
  name = 'Gemini AI Research';
  requiresApiKey = true;
  private genAI: GoogleGenAI;

  constructor(apiKey: string) {
    super(apiKey);
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async search(query: SearchQuery): Promise<BusinessData[]> {
    const { category, city, limit = 10 } = query;
    
    console.log(`🔍 Gemini researching: ${category} in ${city}...`);

    try {
      const model = this.genAI.models;
      
      const prompt = `Find ${category} businesses in ${city}, Iraq. 
Focus on the CITY CENTER only (downtown/main commercial areas), NOT suburbs or surrounding governorates.

Return a JSON array of businesses with these exact fields:
- name: Business name in English
- name_ar: Arabic name if available
- address: Full street address
- city: City name
- phone: Phone number with country code
- website: Website URL or Facebook page
- rating: Rating out of 5 (number)
- review_count: Number of reviews (number)
- hours: Opening hours string
- description: Brief description
- source_url: Where you found this info
- confidence: 0-1 score for data reliability

Return ONLY valid JSON array, no markdown, no explanations. Include ${limit} businesses.`;

      const response = await model.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 4000,
        }
      });

      const text = response.text || '';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[.*\]/s);
      if (!jsonMatch) {
        console.warn('No JSON array found in Gemini response');
        return [];
      }

      const results: GeminiBusinessResult[] = JSON.parse(jsonMatch[0]);
      
      console.log(`✅ Gemini found ${results.length} businesses`);

      // Convert to BusinessData format
      return results.map(result => this.normalize(result, category, city));

    } catch (error) {
      console.error('Gemini research error:', error);
      return [];
    }
  }

  private normalize(result: GeminiBusinessResult, category: string, city: string): BusinessData {
    return {
      name: result.name,
      category: category,
      city: result.city || city,
      address: result.address,
      phone: result.phone ? this.cleanPhone(result.phone) : undefined,
      website: result.website || undefined,
      description: result.description || undefined,
      source_name: 'Gemini AI Research',
      source_url: result.source_url || undefined,
      rating: result.rating || undefined,
      review_count: result.review_count || undefined,
      opening_hours: result.hours || undefined,
    };
  }

  private cleanPhone(phone: string): string {
    // Remove non-numeric except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    
    // Ensure Iraq country code
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.substring(2);
      } else if (cleaned.startsWith('0')) {
        cleaned = '+964' + cleaned.substring(1);
      } else if (!cleaned.startsWith('+964')) {
        cleaned = '+964' + cleaned;
      }
    }
    
    return cleaned;
  }

  private getGovernorateForCity(city: string): string {
    const governorateMap: Record<string, string> = {
      'Baghdad': 'Baghdad Governorate',
      'Basra': 'Basra Governorate',
      'Erbil': 'Erbil Governorate',
      'Sulaymaniyah': 'Sulaymaniyah Governorate',
      'Nineveh': 'Nineveh Governorate',
      'Kirkuk': 'Kirkuk Governorate',
      'Duhok': 'Duhok Governorate',
      'Anbar': 'Anbar Governorate',
      'Babil': 'Babil Governorate',
      'Karbala': 'Karbala Governorate',
      'Wasit': 'Wasit Governorate',
      'Dhi Qar': 'Dhi Qar Governorate',
      'Maysan': 'Maysan Governorate',
      'Muthanna': 'Muthanna Governorate',
      'Najaf': 'Najaf Governorate',
      'Qadisiyyah': 'Qadisiyyah Governorate',
      'Saladin': 'Saladin Governorate',
      'Diyala': 'Diyala Governorate',
    };
    
    return governorateMap[city] || city + ' Governorate';
  }
}
