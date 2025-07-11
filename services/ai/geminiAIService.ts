
import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, GenerateImagesResponse } from "@google/genai";
import { GroundingChunk, AIParsedJsonResponse } from "../../types";
import { parseJsonFromText } from './aiUtils';

const clientInstances: Record<string, GoogleGenAI> = {};

const getGoogleGenAiClientInstance = (apiKey: string): GoogleGenAI | null => {
  if (!apiKey) {
    console.error("Gemini API key was not provided to get instance.");
    return null;
  }
  if (clientInstances[apiKey]) {
    return clientInstances[apiKey];
  }
  try {
    const newClient = new GoogleGenAI({ apiKey });
    clientInstances[apiKey] = newClient;
    return newClient;
  } catch (e) {
    console.error("Failed to initialize GoogleGenAI client:", e);
    return null;
  }
};

export const generateTextInternal = async (
  prompt: string,
  apiKey: string,
  modelName: string,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; groundingChunks?: GroundingChunk[] }> => {
  const ai = getGoogleGenAiClientInstance(apiKey);
  if (!ai) return { text: null, error: "Gemini API client not initialized or API key invalid." };
  
  try {
    const params: GenerateContentParameters = { model: modelName, contents: prompt };
    if (systemInstruction) params.config = { ...params.config, systemInstruction };
    const response: GenerateContentResponse = await ai.models.generateContent(params);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    return { text: response.text, groundingChunks };
  } catch (error) {
    console.error(`Gemini API error (generateTextInternal):`, error);
    return { text: null, error: (error as Error).message };
  }
};

export const generateTextWithGoogleSearchInternal = async (
  prompt: string,
  apiKey: string,
  modelName: string,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; groundingChunks?: GroundingChunk[] }> => {
  const ai = getGoogleGenAiClientInstance(apiKey);
  if (!ai) return { text: null, error: "Gemini API client not initialized." };

  try {
    const params: GenerateContentParameters = {
      model: modelName,
      contents: prompt,
      config: { tools: [{googleSearch: {}}] }
    };
    if (systemInstruction) params.config = { ...params.config, systemInstruction };
    const response: GenerateContentResponse = await ai.models.generateContent(params);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    return { text: response.text, groundingChunks };
  } catch (error) {
    console.error("Gemini API error (generateTextWithGoogleSearchInternal):", error);
    return { text: null, error: (error as Error).message };
  }
};

export const generateJsonInternal = async <T,>(
  prompt: string,
  apiKey: string,
  modelName: string,
  systemInstruction?: string
): Promise<AIParsedJsonResponse<T> & { groundingChunks?: GroundingChunk[] }> => {
  const ai = getGoogleGenAiClientInstance(apiKey);
  if (!ai) return { data: null, error: "Gemini API client not initialized." };

  try {
    // Rely on prompt engineering for JSON output as a more robust method than responseMimeType
    const jsonPrompt = `${prompt}\n\nIMPORTANT: Your entire response must be a single, valid JSON object. Do not include any text, explanations, or markdown formatting (like \`\`\`json) outside of the JSON object.`;

    const params: GenerateContentParameters = {
      model: modelName,
      contents: jsonPrompt,
    };
    if (systemInstruction) {
        params.config = { systemInstruction };
    }
    
    const response: GenerateContentResponse = await ai.models.generateContent(params);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    const parsed = parseJsonFromText<T>(response.text);
    return { ...parsed, groundingChunks };
  } catch (error) {
    console.error("Gemini API error (generateJsonInternal):", error);
    let errorMessage = (error as Error).message;
    // Try to parse the error for a cleaner message
    try {
        const errJson = JSON.parse(errorMessage);
        if (errJson.error && errJson.error.message) {
            errorMessage = `Gemini API Error (${errJson.error.status || errJson.error.code}): ${errJson.error.message}`;
        }
    } catch(e) {
        // Not a JSON error, use as is.
    }
    return { data: null, error: errorMessage };
  }
};

export const generateImagesInternal = async (
  prompt: string,
  apiKey: string,
  modelName: string,
  numberOfImages: number = 1,
): Promise<{ images: string[] | null; error?: string }> => {
   const ai = getGoogleGenAiClientInstance(apiKey);
   if (!ai) return { images: null, error: "Gemini API client not initialized." };
   
  try {
    const response: GenerateImagesResponse = await ai.models.generateImages({
        model: modelName,
        prompt: prompt,
        config: {numberOfImages: numberOfImages, outputMimeType: 'image/jpeg'},
    });
    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64Images = response.generatedImages.map(img => img.image.imageBytes);
      return { images: base64Images };
    }
    return { images: [], error: "No images generated or unexpected response from Gemini."};
  } catch (error) {
    console.error("Gemini API error (generateImagesInternal):", error);
    return { images: null, error: (error as Error).message };
  }
};

export const generateTextStreamInternal = async (
  prompt: string,
  apiKey: string,
  modelName: string,
  onStreamChunk: (chunkText: string) => void,
  onStreamComplete: (fullText: string) => void,
  onError: (error: string) => void,
  systemInstruction?: string
): Promise<void> => {
  const ai = getGoogleGenAiClientInstance(apiKey);
  if (!ai) { onError("Gemini API client not initialized."); return; }
  
  try {
    const params: GenerateContentParameters = { model: modelName, contents: prompt };
    if (systemInstruction) params.config = { ...params.config, systemInstruction };
    const streamGenerator = await ai.models.generateContentStream(params);
    if (!streamGenerator || typeof streamGenerator[Symbol.asyncIterator] !== 'function') {
      onError("Failed to obtain a valid stream from Gemini."); return;
    }
    let fullTextResponse = "";
    for await (const chunk of streamGenerator) {
      // Ensure chunk and chunk.text are valid before processing
      if (chunk && typeof chunk.text === 'string') {
        onStreamChunk(chunk.text);
        fullTextResponse += chunk.text;
      }
    }
    onStreamComplete(fullTextResponse || ""); // Ensure empty string if response is null/undefined
  } catch (error) {
    onError((error as Error).message || "Unknown error during Gemini streaming.");
  }
};
