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

export const generateDailyIdentities = async (count: number = 20): Promise<Array<{name: string, description: string, traits: string}>> => {
  return callWithRetry(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${count} elite high-fashion model personas for a professional digital runway. 
      Focus on sophisticated editorial descriptions and diverse high-fashion traits. 
      Models should be strikingly attractive Caucasian women in an artistic fashion context. 
      Return JSON array with 'name', 'description' (luxury bio), and 'traits' (physical traits like hair/eyes).`,
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
    config: { imageConfig: { aspectRatio: "3:4" } }
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error("SAFETY_FILTER");
  return `data:image/png;base64,${part.inlineData.data}`;
};

export const orchestrateModelStages = async (
  identity: { name: string, description: string, traits: string },
  onStageGenerated: (stage: RevealStage, url: string) => void
): Promise<Record<RevealStage, string>> => {
  const stages: Record<number, string> = {};

  // PURELY ARTISTIC/FASHION FOCUSED PROMPTS FOR ADSENSE COMPLIANCE
  const p0 = `Artistic high-fashion photography. A stunning Caucasian model, ${identity.traits}. Wearing an intricate avant-garde luxury designer gown, cinematic runway lighting, high-fashion editorial style. ${identity.description}. Highly detailed skin and fabric textures.`;
  stages[RevealStage.FullyClothed] = await callWithRetry(() => generateImage(p0));
  onStageGenerated(RevealStage.FullyClothed, stages[RevealStage.FullyClothed]);

  const p1 = `Editorial fashion edit: Transform outfit to a provocative yet artistic luxury summer collection—silk sheer-inspired blouse and designer shorts. Maintain identical model identity, ${identity.traits}, and high-fashion lighting. Purely artistic portrayal.`;
  stages[RevealStage.SummerOutfit] = await callWithRetry(() => generateImage(p1, stages[RevealStage.FullyClothed]));
  onStageGenerated(RevealStage.SummerOutfit, stages[RevealStage.SummerOutfit]);

  const p2 = `Artistic swimwear editorial: Transform outfit to a high-fashion designer bikini. Exotic high-end resort setting. Focus on artistic lighting and luxury styling. Maintain identical face, ${identity.traits}, and editorial quality. 100% professional fashion photography.`;
  stages[RevealStage.Bikini] = await callWithRetry(() => generateImage(p2, stages[RevealStage.SummerOutfit]));
  onStageGenerated(RevealStage.Bikini, stages[RevealStage.Bikini]);

  return stages as Record<RevealStage, string>;
};