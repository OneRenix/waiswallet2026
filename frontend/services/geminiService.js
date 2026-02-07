import { GoogleGenAI } from "@google/genai";

// Initialize AI
// NOTE: In a real production app, don't expose keys in frontend code.
const apiKey = process.env.API_KEY || ""; 
const ai = new GoogleGenAI({ apiKey });

export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

export const chatWithPilot = async (message, context) => {
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

export const scanReceipt = async (base64Image) => {
  try {
    const base64Data = base64Image.includes("base64,")
      ? base64Image.split("base64,")[1]
      : base64Image;

    const prompt = `Analyze this receipt image. Extract the Merchant Name, Total Amount, and infer the Category from this list: groceries, dining, fuel, utilities, travel, shopping, others. Return JSON: {merchant, amount, category, date}`;

    // Note: Schema validation in JS version simplified for flash-preview
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
        responseMimeType: "application/json"
      }
    });

    const text = result.text;
    if (!text) return { merchant: '', amount: 0, category: 'others', date: '' };
    return JSON.parse(text);
  } catch (error) {
    console.error("Receipt Scanning Error:", error);
    throw new Error("Failed to analyze receipt.");
  }
};