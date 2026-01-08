import { GoogleGenAI, Type } from "@google/genai";
import { RevealStage } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key configuration missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateModelIdentity = async (): Promise<{name: string, description: string, traits: string}> => {
  const ai = getAiClient();
  
  const hairColors = ["platinum blonde", "warm honey blonde", "deep raven black", "vibrant auburn red", "ash brown", "strawberry blonde"];
  const eyeColors = ["piercing crystal blue", "deep emerald green", "striking hazel", "misty grey"];
  const facialStyles = ["sharp editorial features", "soft romantic beauty", "exotic and alluring", "classic runway look"];
  
  const randomHair = hairColors[Math.floor(Math.random() * hairColors.length)];
  const randomEye = eyeColors[Math.floor(Math.random() * eyeColors.length)];
  const randomFace = facialStyles[Math.floor(Math.random() * facialStyles.length)];
  const randomTraits = `${randomHair} hair, ${randomEye} eyes, ${randomFace}.`;

  try {
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
  } catch (e) {
    const names = ["Saskia", "Alessandra", "Valentina", "Zaira", "Noemi", "Bianca", "Giselle", "Clara"];
    return { 
      name: names[Math.floor(Math.random() * names.length)] + " " + Math.floor(Math.random() * 100), 
      description: "An icon of modern allure and sophisticated high-fashion glamour.",
      traits: randomTraits
    };
  }
};

const attemptImageGeneration = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash-image";

  const response = await ai.models.generateContent({
    model: model,
    contents: {
      parts: [{ text: prompt }]
    },
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
  // Primary "Bold" Prompt
  const boldPrompt = `Sultry editorial fashion photography, full body length. A stunningly attractive Caucasian female model with ${traits || 'unique features'}. 
  She is ${description}. Wearing an avant-garde, daring designer outfit: a sheer silk gown with plunging neckline or intricate luxury bodysuit. 
  Seductive pose, intense gaze, cinematic lighting, 8k resolution, vogue aesthetic.`;

  // Secondary "Safe-Editorial" Prompt (Fallback)
  const fallbackPrompt = `High-end luxury fashion portrait. A beautiful Caucasian female model with ${traits || 'striking features'}. 
  Wearing a sophisticated, figure-hugging designer dress. Dramatic lighting, glamorous setting, editorial style, photorealistic.`;

  try {
    return await attemptImageGeneration(boldPrompt);
  } catch (error) {
    console.warn("Bold prompt filtered, trying fallback...", error);
    try {
      return await attemptImageGeneration(fallbackPrompt);
    } catch (finalError) {
      console.error("Image generation failed completely", finalError);
      throw finalError;
    }
  }
};

export const transformModelOutfit = async (
  currentImageBase64: string,
  targetStage: RevealStage,
  customPrompt?: string
): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-2.5-flash-image"; 

  let prompt = "";
  if (customPrompt) {
    prompt = customPrompt;
  } else {
    switch (targetStage) {
      case RevealStage.SummerOutfit:
        prompt = "Modify her outfit to a stunning, daring summer look. A sheer cropped silk top and mini shorts. Bare midriff, high-fashion seductive vibe. Keep her identical face and features.";
        break;
      case RevealStage.Bikini:
        prompt = "Modify her outfit to a minimalist luxury designer bikini. Seductive high-fashion swimwear, exotic beach setting, high-cut silhouette. Keep her identical face and features.";
        break;
      default:
        prompt = "Enhance the alluring details and lighting of this high-fashion editorial shot.";
    }
  }

  const base64Data = currentImageBase64.replace(/^data:image\/\w+;base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Data
            }
          }
        ],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate || !candidate.content || !candidate.content.parts) {
       throw new Error("Transformation blocked by safety filters.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Transformation failed.");
  } catch (error) {
    console.error("Error transforming image:", error);
    throw error;
  }
};