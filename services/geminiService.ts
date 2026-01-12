
import { GoogleGenAI } from "@google/genai";
import { InventoryItem } from "../types";

export async function getInventoryInsights(items: InventoryItem[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyze the following inventory data and provide 3 key business insights or warnings. 
    Focus on low stock, high-value items, or restock priorities.
    Keep it concise.
    Data: ${JSON.stringify(items)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return "Unable to generate insights at this moment.";
  }
}
