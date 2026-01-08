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
      const isSafety = rawMessage.includes("Safety") || rawMessage.includes("blocked");
      
      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      if (isRateLimit) throw new Error("QUOTA_EXHAUSTED");
      if (isSafety) throw new Error("SAFETY_FILTER");
      throw new Error("SERVICE_UNAVAILABLE");
    }
  }
  throw lastError;
}

/**
 * Generates 20 distinct model identities in a single batch to save planning tokens.
 */
export const generateDailyIdentities = async (count: number = 20): Promise<Array<{name: string, description: string, traits: string}>> => {
  return callWithRetry(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${count} unique, high-fashion female model identities for today's elite runway. 
      Models should be Caucasian, stunningly attractive, each with unique hair/eye colors and editorial traits.
      Return as a JSON array of objects with 'name', 'description', and 'traits'.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              traits: { type: Type.STRING, description: "Detailed physical traits like hair and eye color" }
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

/**
 * The Agency Orchestrator: Pre-generates all 3 stages for a single model.
 */
export const orchestrateModelStages = async (
  identity: { name: string, description: string, traits: string },
  onStageGenerated: (stage: RevealStage, url: string) => void
): Promise<Record<RevealStage, string>> => {
  const stages: Record<number, string> = {};

  // Stage 0: Fully Clothed (Initial)
  const p0 = `Full-length editorial high-fashion photo. Stunning Caucasian model, ${identity.traits}. Wearing an alluring luxury designer gown, plunging neckline. ${identity.description}. Cinematic lighting.`;
  stages[RevealStage.FullyClothed] = await callWithRetry(() => generateImage(p0));
  onStageGenerated(RevealStage.FullyClothed, stages[RevealStage.FullyClothed]);

  // Stage 1: Summer Outfit (Progressive)
  const p1 = `High-fashion edit: Change outfit to a provocative luxury summer look, sheer silk crop top and mini skirt. Keep the model's identity, face, and ${identity.traits} identical. Same pose.`;
  stages[RevealStage.SummerOutfit] = await callWithRetry(() => generateImage(p1, stages[RevealStage.FullyClothed]));
  onStageGenerated(RevealStage.SummerOutfit, stages[RevealStage.SummerOutfit]);

  // Stage 2: Bikini (Final)
  const p2 = `High-fashion edit: Change outfit to a minimalist luxury high-cut string bikini. Beach setting. Keep model's face, identity, and ${identity.traits} identical.`;
  stages[RevealStage.Bikini] = await callWithRetry(() => generateImage(p2, stages[RevealStage.SummerOutfit]));
  onStageGenerated(RevealStage.Bikini, stages[RevealStage.Bikini]);

  return stages as Record<RevealStage, string>;
};
