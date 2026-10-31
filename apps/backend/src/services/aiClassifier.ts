import axios from 'axios';

export interface ClassificationResult {
  material_type: string;
  estimated_weight: number;
  confidence: number;
  description: string;
}

const OPENROUTER_SYSTEM_PROMPT = `You are a waste classification AI for a recycling rewards app in Nairobi, Kenya.
Analyze the image and return ONLY valid JSON with no extra text.
Response format:
{
  "material_type": "PET Plastic" | "HDPE Plastic" | "Aluminum" | "Glass" | "Cardboard" | "Mixed Plastic" | "Unknown",
  "estimated_weight": <number in kg, float>,
  "confidence": <float 0.0-1.0>,
  "description": "<brief one-sentence description of what you see>"
}`;

export async function classifyWaste(
  base64Image: string,
  mimeType: string
): Promise<ClassificationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: 'openai/gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: OPENROUTER_SYSTEM_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://takatrace.app',
        'X-Title': 'TakaTrace dMRV',
      },
      timeout: 25000,
    }
  );

  const raw = response.data.choices[0].message.content;
  const parsed = JSON.parse(raw) as ClassificationResult;

  if (!parsed.material_type || typeof parsed.confidence !== 'number') {
    throw new Error('Invalid AI response format');
  }

  return parsed;
}
