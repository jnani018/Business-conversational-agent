
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Ensure API_KEY is handled as per instructions (must be from process.env)
// The application code assumes process.env.API_KEY is set in the environment.
// No UI for API key input should be generated.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.error("API_KEY environment variable not found. Gemini API will not be available.");
}

export const analyzeSheetDataWithGemini = async (sheetCsvData: string, question: string): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API client is not initialized. Check API_KEY configuration.");
  }
  if (!sheetCsvData.trim()) {
    return "No data provided. Please paste your sheet data (CSV) first.";
  }

  const model = 'gemini-2.5-flash-preview-04-17';
  
  const prompt = `
You are an expert business analyst and conversational AI. Your primary task is to analyze the provided CSV data (representing a Google Sheet) and answer the user's question based *solely* on this data.

**Instructions:**
1.  **Data Source:** The data you will analyze is provided below in CSV format.
2.  **Accuracy:** Base your answers strictly on the information present in the CSV data. Do not make assumptions or use external knowledge.
3.  **"Messed Up" Data Handling:** The CSV data might be "hard and messed up". This means it could contain inconsistencies, missing values, unusual formatting, or unclear column headers. Do your best to interpret it logically.
4.  **Clarity:** If the data is insufficient to answer the question or is too ambiguous, clearly state that you cannot answer based on the provided information.
5.  **Conciseness:** Provide clear, concise, and professional answers.
6.  **No Fabrication:** Do not invent data or information not present in the CSV.

**Provided CSV Data:**
\`\`\`csv
${sheetCsvData}
\`\`\`

**User's Question:**
"${question}"

**Your Analysis and Answer:**
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: prompt,
      // No specific thinkingConfig, use default for better quality on complex data
    });
    
    // Extract text directly as per guidelines
    const textResponse = response.text;

    if (!textResponse) {
      return "I received an empty response. I might not have enough information or the query was unclear.";
    }
    return textResponse.trim();

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        // More specific error messages can be helpful
        if (error.message.includes('API key not valid')) {
            throw new Error("Invalid API Key. Please check your API_KEY environment variable.");
        }
         if (error.message.includes('quota')) {
            throw new Error("API quota exceeded. Please check your Google Cloud project quotas for the Gemini API.");
        }
    }
    throw new Error("An error occurred while communicating with the AI. Please try again later.");
  }
};