
import { GoogleGenAI, Type } from "@google/genai";

export const generateRelatedKeywords = async (baseKeyword: string): Promise<string[]> => {
  try {
    // Initializing Gemini API strictly using process.env.API_KEY as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a list of exactly 10-12 keywords or phrases related to "${baseKeyword}" that someone might want to block in their social media feed to completely avoid this topic. Focus on synonyms, sub-topics, or common associated terms. Return as a plain JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    // Accessing response text directly via property
    const text = response.text;
    if (text) {
      return JSON.parse(text);
    }
    return [];
  } catch (error) {
    console.error("Gemini Error:", error);
    return [];
  }
};
