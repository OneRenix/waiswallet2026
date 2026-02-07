export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

export const chatWithPilot = async (message: string, context: any) => {
    console.log("Chat context:", context);
    return "The AI Chat is currently being refactored to use the backend. Stay tuned!";
};

export const scanReceipt = async (base64Image: string) => {
    console.log("Scanning image:", base64Image.substring(0, 50) + "...");
    return {
        merchant: "Sample Store",
        amount: 123.45,
        category: "others",
        date: new Date().toISOString().split('T')[0],
        note: "Scan successful (Simulation Mode)"
    };
};
