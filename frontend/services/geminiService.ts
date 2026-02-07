import { GoogleGenAI, Type } from "@google/genai";
import { CardData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const chatWithPilot = async (
  message: string,
  context: {
    cards: CardData[];
    remainingBudget: number;
    categoryBudgets: Record<string, number>;
    totalCash: number;
    currentDate: string;
  }
): Promise<string> => {
  try {
    const financialContextStr = JSON.stringify({
      currentDate: context.currentDate,
      cards: context.cards.map((c) => ({
        name: c.name,
        balance: c.balance,
        limit: c.limit,
        type: c.type,
      })),
      remainingBudget: context.remainingBudget,
      categoryBudgets: context.categoryBudgets,
      totalCash: context.totalCash,
    });

    const systemInstruction = `You are WaisWallet, a financial navigator for the Philippines market. 
    Context: ${financialContextStr}. 
    Guide users towards responsible spending and building emergency funds. 
    Discourage risky financial behaviour. 
    Always explain the 'why' behind strategy (e.g. why float matters). 
    Keep responses friendly and under 50 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: systemInstruction,
      },
      contents: [{ role: 'user', parts: [{ text: message }] }]
    });

    return response.text || "I'm having trouble analyzing the flight path.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I hit a bit of turbulence. Could you repeat that?";
  }
};

export const scanReceipt = async (base64Image: string): Promise<{
  merchant: string;
  amount: number;
  category: string;
  date: string;
  note: string;
}> => {
  try {
    const base64Data = base64Image.includes("base64,")
      ? base64Image.split("base64,")[1]
      : base64Image;

    const prompt = `Analyze this receipt image. Extract the Merchant Name, Total Amount, and infer the Category from this list: groceries, dining, fuel, utilities, travel, shopping, others. 
    
    Also generate a short, descriptive summary for the note field describing the items bought or the purpose (e.g., "Take-out order including Chicken Parmesan and Earthquake Cheese at Ayala Malls Circuit.").`;

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            date: { type: Type.STRING },
            category: { type: Type.STRING },
            note: { type: Type.STRING },
          },
          required: ["merchant", "amount", "category"],
        },
      },
    });

    const text = result.text;
    if (!text) return { merchant: '', amount: 0, category: 'others', date: '', note: '' };
    return JSON.parse(text);
  } catch (error) {
    console.error("Receipt Scanning Error:", error);
    throw new Error("Failed to analyze receipt.");
  }
};