import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
if (apiKey) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.warn('Gemini API Initialization error:', e);
  }
}

export async function callGeminiJSON<T>(prompt: string, fallbackData: T): Promise<T> {
  if (!genAI || !apiKey) {
    return fallbackData;
  }

  const candidateModels = ['gemini-3.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        `${prompt}\n\nIMPORTANT: Respond strictly with valid JSON only. Do not include markdown code fence formatting or quotes around the JSON block.`
      ]);
      const text = result.response.text();
      const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(cleanText) as T;
    } catch (error) {
      console.warn(`Gemini API call failed with model ${modelName}, trying fallback:`, error);
    }
  }

  return fallbackData;
}

export async function callGeminiText(prompt: string, fallbackText: string): Promise<string> {
  if (!genAI || !apiKey) {
    return fallbackText;
  }

  const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-2.5-flash'];

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) return text;
    } catch (error) {
      console.warn(`Gemini API text call failed with model ${modelName}:`, error);
    }
  }

  return fallbackText;
}

