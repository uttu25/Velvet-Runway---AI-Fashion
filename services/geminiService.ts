import { GoogleGenAI, Type } from "@google/genai";
import { RevealStage } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key configuration missing.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Robust retry wrapper for API calls with exponential backoff.
 * Specifically handles 429 (Rate Limit) and quota errors.
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorStr = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
      const isRateLimit = errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED") || errorStr.includes("quota");
      
      if (isRateLimit && i < maxRetries - 1) {
        // Exponential backoff: 2s, 4s, 8s... + jitter
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`Rate limit or quota hit. Attempt ${i + 1}/${maxRetries}. Retrying in ${Math.round(waitTime)}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // If not a rate limit, or we're out of retries, throw
      throw new Error(errorStr);
    }
  }
  throw lastError;
}

export const generateModelIdentity = async (): Promise<{name: string, description: string, traits: string}> => {
  return callWithRetry(async () => {
    const ai = getAiClient();
    
    const hairColors = ["platinum blonde", "warm honey blonde", "deep raven black", "vibrant auburn red", "ash brown", "strawberry blonde"];
    const eyeColors = ["piercing crystal blue", "deep emerald green", "striking hazel", "misty grey"];
    const facialStyles = ["sharp editorial features", "soft romantic beauty", "alluring gaze", "classic runway look"];
    
    const randomHair = hairColors[Math.floor(Math.random() * hairColors.length)];
    const randomEye = eyeColors[Math.floor(Math.random() * eyeColors.length)];
    const randomFace = facialStyles[Math.floor(Math.random() * facialStyles.length)];
    const randomTraits = `${randomHair} hair, ${randomEye} eyes, ${randomFace}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a stunningly attractive name and a sensual, captivating 1-sentence bio for a high-fashion female model. 
      She is Caucasian. Focus on high-end allure and elite glamour. Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          propertyOrdering: ["name", "description"]
        }
      }
    });
    const text = response.text?.trim() || "{}";
    const data = JSON.parse(text);
    return { ...data, traits: randomTraits };
  }).catch(() => {
    // Ultimate fallback if identity fails after all retries
    const names = ["Saskia", "Alessandra", "Valentina", "Zaira", "Noemi", "Bianca", "Giselle", "Clara"];
    return { 
      name: names[Math.floor(Math.random() * names.length)] + " " + Math.floor(Math.random() * 100), 
      description: "An icon of modern allure and sophisticated high-fashion glamour.",
      traits: "Striking features and honey-blonde hair."
    };
  });
};

const attemptImageAction = async (prompt: string, imageBase64?: string): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash-image";

  const contents: any = {
    parts: [{ text: prompt }]
  };

  if (imageBase64) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    contents.parts.push({
      inlineData: {
        mimeType: "image/png",
        data: base64Data
      }
    });
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: contents,
    config: {
      imageConfig: {
        aspectRatio: "3:4"
      }
    }
  });

  const candidate = response.candidates?.[0];
  if (!candidate || !candidate.content || !candidate.content.parts) {
    throw new Error("Safety Filter or Empty Response");
  }

  for (const part of candidate.content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data found in response");
};

export const generateInitialModelImage = async (
  description: string,
  traits?: string
): Promise<string> => {
  const boldPrompt = `Provocative high-fashion photography, full length. A beautiful Caucasian model with ${traits || 'striking features'}. 
  She is ${description}. Outfit: Daring designer look with luxury fabrics, plunging neckline, high-fashion silhouette. 
  Seductive pose, cinematic lighting, ultra-detailed textures.`;

  const fallbackPrompt = `Editorial fashion portrait. A stunningly attractive Caucasian model with ${traits || 'striking features'}. 
  Sophisticated figure-hugging designer clothing, high-fashion styling, dramatic lighting.`;

  return callWithRetry(async () => {
    try {
      return await attemptImageAction(boldPrompt);
    } catch (error: any) {
      // If it's a safety filter error (not a 429), try fallback immediately within the attempt
      if (error.message?.includes("Safety")) {
        console.warn("Safety filter hit on bold prompt, trying fallback...");
        return await attemptImageAction(fallbackPrompt);
      }
      throw error;
    }
  });
};

export const transformModelOutfit = async (
  currentImageBase64: string,
  targetStage: RevealStage,
  customPrompt?: string
): Promise<string> => {
  let primaryPrompt = "";
  let fallbackPrompt = "";

  if (customPrompt) {
    primaryPrompt = `Apply this high-fashion edit: ${customPrompt}. Keep the model's identity, face, and basic pose identical.`;
    fallbackPrompt = `Gently apply this stylistic edit: ${customPrompt}. Maintain identical model features.`;
  } else {
    switch (targetStage) {
      case RevealStage.SummerOutfit:
        primaryPrompt = "Modify her outfit to a stunning designer summer look: a sheer-inspired luxury crop top and mini silk skirt. Alluring vibe, identical model features.";
        fallbackPrompt = "High-fashion summer editorial change: luxury sleeveless top and mini skirt. Identical model.";
        break;
      case RevealStage.Bikini:
        primaryPrompt = "Modify the outfit to a minimalist high-cut luxury designer bikini. Seductive swimwear editorial, beach setting, identical face and features.";
        fallbackPrompt = "Transform into a luxury designer swimwear look. High-cut silhouette, exotic beach aesthetic, identical model.";
        break;
      default:
        primaryPrompt = "Reset to original high-fashion luxury gown. Elegant and alluring, identical face.";
        fallbackPrompt = "Classic editorial fashion styling, identical face.";
    }
  }

  return callWithRetry(async () => {
    try {
      return await attemptImageAction(primaryPrompt, currentImageBase64);
    } catch (error: any) {
      if (error.message?.includes("Safety")) {
        console.warn("Transformation safety filter hit, trying fallback...");
        return await attemptImageAction(fallbackPrompt, currentImageBase64);
      }
      throw error;
    }
  });
};