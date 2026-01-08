import { GoogleGenAI, Type } from "@google/genai";
import { RevealStage, ModelProfile } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Configuration Unavailable");
  }
  return new GoogleGenAI({ apiKey });
};

async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const rawMessage = error?.message || "Internal error";
      const isRateLimit = rawMessage.includes("429") || rawMessage.includes("RESOURCE_EXHAUSTED") || rawMessage.includes("quota");
      
      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (isRateLimit) throw new Error("QUOTA_EXHAUSTED");
      throw new Error("SERVICE_UNAVAILABLE");
    }
  }
  throw lastError;
}

/**
 * AI Agent: Daily Planning Identity Service
 * Generates 20 distinct model personas for the day.
 */
export const generateDailyIdentities = async (count: number = 20): Promise<Array<{name: string, description: string, traits: string}>> => {
  return callWithRetry(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are the lead casting director for Velvet Runway. 
      Draft ${count} high-fashion female model personas for today's digital showcase.
      Each persona must have: 
      1. A professional model name.
      2. A luxury editorial bio.
      3. Precise physical traits (hair style/color, eye color, unique facial features) to ensure consistent AI generation.
      Models should be Caucasian, stunningly attractive, and fit for haute couture.
      Return as a JSON array of objects with keys: 'name', 'description', 'traits'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              traits: { type: Type.STRING }
            },
            required: ["name", "description", "traits"]
          }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  });
};

/**
 * Image Generation Agent
 */
const generateImage = async (prompt: string, referenceImage?: string): Promise<string> => {
  const ai = getAiClient();
  const contents: any = { parts: [{ text: prompt }] };
  
  if (referenceImage) {
    contents.parts.push({
      inlineData: {
        mimeType: "image/png",
        data: referenceImage.replace(/^data:image\/\w+;base64,/, "")
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: contents,
    config: { 
      imageConfig: { 
        aspectRatio: "3:4"
      } 
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error("SAFETY_FILTER");
  return `data:image/png;base64,${part.inlineData.data}`;
};

/**
 * AI Manager: Triple-Stage Orchestration
 * Automates the generation of 3 stages for a single identity while maintaining visual consistency.
 */
export const orchestrateModelStages = async (
  identity: { name: string, description: string, traits: string },
  onProgress: (stage: RevealStage) => void
): Promise<Record<RevealStage, string>> => {
  const stages: Record<number, string> = {};

  // Stage 0: The Hook (Editorial Gown)
  const p0 = `HIGH-FASHION EDITORIAL: Full body photo of a stunning model, ${identity.traits}. Wearing an intricate, avant-garde designer gown. Elegant runway setting with cinematic luxury lighting. ${identity.description}. 8k resolution, professional photography.`;
  stages[RevealStage.FullyClothed] = await callWithRetry(() => generateImage(p0));
  onProgress(RevealStage.FullyClothed);

  // Stage 1: The Transition (Summer Look)
  const p1 = `STYLING CHANGE: Change the outfit to a provocative yet artistic luxury summer collection (sheer silk blouse and shorts). MAINTAIN IDENTICAL FACE, HAIR, AND IDENTITY from the provided image. Same model, ${identity.traits}. Same high-fashion atmosphere.`;
  stages[RevealStage.SummerOutfit] = await callWithRetry(() => generateImage(p1, stages[RevealStage.FullyClothed]));
  onProgress(RevealStage.SummerOutfit);

  // Stage 2: The Final Reveal (Luxury Bikini)
  const p2 = `SWIMWEAR EDITORIAL: Change the outfit to a minimalist luxury string bikini. MAINTAIN IDENTICAL FACE, HAIR, AND IDENTITY of the model. Resort setting. Artistic and professional high-fashion photography. Model traits: ${identity.traits}.`;
  stages[RevealStage.Bikini] = await callWithRetry(() => generateImage(p2, stages[RevealStage.SummerOutfit]));
  onProgress(RevealStage.Bikini);

  return stages as Record<RevealStage, string>;
};
