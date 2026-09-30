import { GoogleGenAI } from '@google/genai';
import { ProductCondition, VehicleFitment } from '../../src/types';
import { normaliseBrand, cleanProductTitle } from './importEngine';

export interface AiIdentificationResult {
  title: string;
  brand: string;
  model: string;
  mpn: string;
  barcode: string;
  category: string;
  department: string;
  condition: ProductCondition;
  conditionDescription: string;
  defectsDetected: string[];
  ocrExtractedText: string[];
  suggestedPrice: number;
  priceReasoning: string;
  shortDescription: string;
  description: string;
  features: string[];
  specs: Record<string, string>;
  whatsIncluded: string[];
  searchKeywords: string[];
  seoTitle: string;
  metaDescription: string;
  tags: string[];
  ebayTitle: string;
  ebayCategory: string;
  ebayItemSpecifics: Record<string, string>;
  vehicleFitment?: VehicleFitment[];
  confidence: {
    overall: number;
    title: number;
    brand: number;
    model: number;
    category: number;
    condition: number;
    price: number;
    ocr: number;
    requiresManualConfirmation: boolean;
  };
  aiReasoningNotes: string;
}

export async function identifyAndGenerateListing(
  ai: GoogleGenAI,
  inputs: {
    images?: string[];
    barcode?: string;
    rawText?: string;
    brandHint?: string;
    conditionHint?: ProductCondition;
    costPrice?: number;
    categoryHint?: string;
    existingTitle?: string;
  }
): Promise<AiIdentificationResult> {
  const prompt = `
You are the CheapLoot Master Product Identification & Listing Engine for an Australian discount/liquidation/hardware/auto/media store.

Analyze the provided product inputs with extreme factual discipline.
MANDATORY RULES:
1. NEVER INVENT or hallucinate model numbers, specifications, OEM codes, or vehicle fitment if they cannot be determined from verified inputs.
2. If uncertain, lower the confidence score and note "Manual confirmation required".
3. Title rule: Brand + Model + Product Type + Key Specification + Condition (No ALL CAPS, no spammy words like "L@@K", "RARE", "CHEAP").
4. Detect visible defects if photos are described or provided (scratches, dents, cracks, wear).
5. Generate clean structured description sections:
   - Overview
   - Key Features (array)
   - Technical Specifications (key-value object)
   - Condition Details (truthful disclosure of physical state)
   - What's Included (exact accessories/items)
6. Provide suggested retail price (Target 45-65% gross margin on cost, or Australian market liquidation price).
7. eBay Title MUST be max 80 characters, keyword-dense yet human readable.
8. Extract category-specific attributes (Tools: voltage/platform; Automotive: make/model/year/position/OEM; DVDs: format/region 4/genre; Books: author/ISBN; Electronics: specs).

INPUT DATA:
- Barcode / EAN: ${inputs.barcode || 'N/A'}
- Raw Title / Notes: ${inputs.rawText || inputs.existingTitle || 'N/A'}
- Brand Hint: ${inputs.brandHint || 'N/A'}
- Condition Hint: ${inputs.conditionHint || 'Good Used'}
- Acquisition Cost: $${inputs.costPrice !== undefined ? inputs.costPrice.toFixed(2) : '15.00'}
- Category Hint: ${inputs.categoryHint || 'N/A'}
- Image count: ${inputs.images ? inputs.images.length : 0}

Respond in pure valid JSON (no markdown fences, just JSON):
{
  "title": "string",
  "brand": "string",
  "model": "string",
  "mpn": "string",
  "barcode": "string",
  "category": "string",
  "department": "Tools & Hardware | Automotive | DVDs & Media | Electronics | Home & Garden | Sports & Outdoors",
  "condition": "Brand New | New Other | Open Box | Refurbished | Excellent Used | Good Used | Fair Used | For Parts / Not Working",
  "conditionDescription": "string",
  "defectsDetected": ["string"],
  "ocrExtractedText": ["string"],
  "suggestedPrice": number,
  "priceReasoning": "string",
  "shortDescription": "string",
  "description": "string",
  "features": ["string"],
  "specs": { "Key": "Value" },
  "whatsIncluded": ["string"],
  "searchKeywords": ["string"],
  "seoTitle": "string",
  "metaDescription": "string",
  "tags": ["string"],
  "ebayTitle": "string (max 80 chars)",
  "ebayCategory": "string",
  "ebayItemSpecifics": { "Key": "Value" },
  "vehicleFitment": [
    {
      "make": "string",
      "model": "string",
      "yearFrom": 2015,
      "yearTo": 2020,
      "series": "string",
      "notes": "Possible fitment - verify OEM"
    }
  ],
  "confidence": {
    "overall": 92,
    "title": 95,
    "brand": 98,
    "model": 88,
    "category": 94,
    "condition": 80,
    "price": 85,
    "ocr": 90,
    "requiresManualConfirmation": false
  },
  "aiReasoningNotes": "string"
}
`;

  const FALLBACK_MODELS = ['gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview'];

  try {
    let response: any = null;
    let lastErr: any = null;

    for (const modelName of FALLBACK_MODELS) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        });
        if (response?.text) break;
      } catch (err: any) {
        lastErr = err;
        const msg = err?.message || String(err);
        if ((msg.includes('fetch failed') || msg.includes('504')) && !msg.includes('503')) {
          try {
            await new Promise(r => setTimeout(r, 200));
            response = await ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                temperature: 0.2
              }
            });
            if (response?.text) break;
          } catch (retryErr: any) {
            lastErr = retryErr;
          }
        }
        // Immediately failover to next model on 503 or 429
        continue;
      }
    }

    if (!response?.text && lastErr) {
      throw lastErr;
    }

    const text = response?.text?.trim() || '{}';
    const parsed = JSON.parse(text);

    // Apply canonical brand normalization
    if (parsed.brand) {
      parsed.brand = normaliseBrand(parsed.brand);
    }
    if (parsed.title) {
      parsed.title = cleanProductTitle(parsed.title, parsed.brand, parsed.model, parsed.condition);
    }

    return parsed;
  } catch (err: any) {
    console.warn('AI identification fallback trigger:', err.message);
    // Intelligent deterministic fallback
    const raw = inputs.rawText || inputs.existingTitle || 'Commercial Liquidation Product';
    const brand = normaliseBrand(inputs.brandHint || 'CheapLoot');
    const cost = inputs.costPrice || 15;
    const suggestedPrice = Number((cost * 2.2).toFixed(2));

    return {
      title: `${brand} ${raw}`,
      brand,
      model: '',
      mpn: '',
      barcode: inputs.barcode || '',
      category: inputs.categoryHint || 'Tools & Hardware',
      department: 'Tools & Hardware',
      condition: inputs.conditionHint || 'Good Used',
      conditionDescription: 'Inspected item in good operational condition. Please review photos for exact cosmetic appearance.',
      defectsDetected: [],
      ocrExtractedText: [],
      suggestedPrice,
      priceReasoning: `Calculated from acquisition cost ($${cost.toFixed(2)}) aiming for standard retail turnover margin.`,
      shortDescription: `Authentic ${brand} item available at CheapLoot liquidation pricing.`,
      description: `### Overview\n${brand} equipment ready for pickup or fast dispatch.\n\n### Condition\nPre-owned inventory inspected prior to cataloging.`,
      features: ['Genuine manufacturer item', 'Inspected for basic physical integrity', 'Local warehouse stock'],
      specs: { Brand: brand, Condition: inputs.conditionHint || 'Good Used' },
      whatsIncluded: ['Item as pictured'],
      searchKeywords: [brand.toLowerCase(), 'cheploot', 'hardware', 'australia'],
      seoTitle: `${brand} ${raw} | CheapLoot Australia`,
      metaDescription: `Buy ${brand} at CheapLoot for only $${suggestedPrice.toFixed(2)}. In stock with fast Australian dispatch.`,
      tags: ['liquidation', brand.toLowerCase()],
      ebayTitle: `${brand} ${raw}`.slice(0, 80),
      ebayCategory: 'Home & Garden > Tools',
      ebayItemSpecifics: { Brand: brand },
      confidence: {
        overall: 65,
        title: 70,
        brand: 80,
        model: 50,
        category: 65,
        condition: 60,
        price: 70,
        ocr: 0,
        requiresManualConfirmation: true
      },
      aiReasoningNotes: 'Generated using local deterministic engine. Please verify model number and specifications.'
    };
  }
}
