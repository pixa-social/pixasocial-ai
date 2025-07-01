import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, GenerateImagesResponse } from "@google/genai";
import { GroundingChunk, AIParsedJsonResponse, AiProviderType } from "../../types";
import { getApiKeyForProvider, getModelForProvider, parseJsonFromText } from './aiUtils';

let googleGenAiClient: GoogleGenAI | null = null;
let currentGeminiApiKey: string | null = null;

const getGoogleGenAiClientInstance = (): GoogleGenAI | null => {
  const geminiApiKey = getApiKeyForProvider(AiProviderType.Gemini);
  if (!geminiApiKey) {
    if (googleGenAiClient) googleGenAiClient = null; // Clear instance if key removed
    currentGeminiApiKey = null;
    console.warn("Gemini API key not found. Gemini features will be disabled.");
    return null;
  }
  // Re-initialize if API key changes or client not set
  if (!googleGenAiClient || currentGeminiApiKey !== geminiApiKey) {
     try {
        googleGenAiClient = new GoogleGenAI({ apiKey: geminiApiKey });
        currentGeminiApiKey = geminiApiKey;
     } catch (e) {
        console.error("Failed to initialize GoogleGenAI client:", e);
        googleGenAiClient = null;
        currentGeminiApiKey = null;
        return null;
     }
  }
  return googleGenAiClient;
};

export const generateTextInternal = async (
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; groundingChunks?: GroundingChunk[] }> => {
  const ai = getGoogleGenAiClientInstance();
  const modelName = getModelForProvider(AiProviderType.Gemini, 'text');
  if (!ai) return { text: null, error: "Gemini API client not initialized or API key missing/invalid." };
  if (!modelName) return { text: null, error: "Gemini text model not configured." };
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
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; groundingChunks?: GroundingChunk[] }> => {
  const ai = getGoogleGenAiClientInstance();
  const modelName = getModelForProvider(AiProviderType.Gemini, 'text');
  if (!ai) return { text: null, error: "Gemini API client not initialized." };
  if (!modelName) return { text: null, error: "Gemini text model not configured." };
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
  systemInstruction?: string
): Promise<AIParsedJsonResponse<T> & { groundingChunks?: GroundingChunk[] }> => {
  const ai = getGoogleGenAiClientInstance();
  const modelName = getModelForProvider(AiProviderType.Gemini, 'text');
  if (!ai) return { data: null, error: "Gemini API client not initialized." };
  if (!modelName) return { data: null, error: "Gemini text model not configured." };
  try {
    const params: GenerateContentParameters = {
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    };
    if (systemInstruction) params.config = { ...params.config, systemInstruction };
    const response: GenerateContentResponse = await ai.models.generateContent(params);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
    const parsed = parseJsonFromText<T>(response.text);
    return { ...parsed, groundingChunks };
  } catch (error) {
    console.error("Gemini API error (generateJsonInternal):", error);
    return { data: null, error: (error as Error).message };
  }
};

export const generateImagesInternal = async (
  prompt: string,
  numberOfImages: number = 1,
): Promise<{ images: string[] | null; error?: string }> => {
   const ai = getGoogleGenAiClientInstance();
   const modelName = getModelForProvider(AiProviderType.Gemini, 'image');
   if (!ai) return { images: null, error: "Gemini API client not initialized." };
   if (!modelName) return { images: null, error: "Gemini image model not configured."};
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
  onStreamChunk: (chunkText: string) => void,
  onStreamComplete: (fullText: string) => void,
  onError: (error: string) => void,
  systemInstruction?: string
): Promise<void> => {
  const ai = getGoogleGenAiClientInstance();
  const modelName = getModelForProvider(AiProviderType.Gemini, 'text');
  if (!ai) { onError("Gemini API client not initialized."); return; }
  if (!modelName) { onError("Gemini text model not configured for streaming."); return; }
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
