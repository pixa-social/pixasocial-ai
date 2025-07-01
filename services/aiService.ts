import { AIParsedJsonResponse, GroundingChunk, AiProviderType } from "../types";
import { getActiveAiProviderType, handleNonImplementedProvider, getProviderConfig } from './ai/aiUtils';
import * as GeminiService from './ai/geminiAIService';
import * as OpenAICompatibleService from './ai/openAICompatibleAIService';

// --- Unified Text Generation ---
export const generateText = async (
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; groundingChunks?: GroundingChunk[] }> => {
  const activeProviderType = getActiveAiProviderType();
  
  switch (activeProviderType) {
    case AiProviderType.Gemini:
      return GeminiService.generateTextInternal(prompt, systemInstruction);
    case AiProviderType.OpenAI:
    case AiProviderType.Deepseek:
    case AiProviderType.Groq:
      const result = await OpenAICompatibleService.generateTextInternal(activeProviderType, prompt, systemInstruction);
      return { ...result, groundingChunks: [] }; // OpenAI compatible services don't have grounding chunks here
    default:
      const res = handleNonImplementedProvider(activeProviderType, "Text generation");
      return { text: null, error: res.error, groundingChunks: [] };
  }
};

export const generateTextWithGoogleSearch = async (
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; groundingChunks?: GroundingChunk[] }> => {
  const activeProviderType = getActiveAiProviderType();

  if (activeProviderType === AiProviderType.Gemini) {
    return GeminiService.generateTextWithGoogleSearchInternal(prompt, systemInstruction);
  } else {
    console.warn(`Google Search grounding is a Gemini-specific feature. ${activeProviderType} does not support it.`);
    return { text: null, error: `Google Search grounding is only available for Gemini. Current provider: ${activeProviderType}`, groundingChunks: [] };
  }
};

export const generateJson = async <T,>(
  prompt: string,
  systemInstruction?: string
): Promise<AIParsedJsonResponse<T> & { groundingChunks?: GroundingChunk[] }> => {
  const activeProviderType = getActiveAiProviderType();

  switch (activeProviderType) {
    case AiProviderType.Gemini:
      return GeminiService.generateJsonInternal<T>(prompt, systemInstruction);
    case AiProviderType.OpenAI:
    case AiProviderType.Deepseek:
    case AiProviderType.Groq:
      const result = await OpenAICompatibleService.generateJsonInternal<T>(activeProviderType, prompt, systemInstruction);
      return { ...result, groundingChunks: [] };
    default:
      const res = handleNonImplementedProvider(activeProviderType, "JSON generation");
      return { data: null, error: res.error, groundingChunks: [] };
  }
};

export const generateImages = async (
  prompt: string,
  numberOfImages: number = 1,
): Promise<{ images: string[] | null; error?: string }> => {
  const activeProviderType = getActiveAiProviderType();

  switch (activeProviderType) {
    case AiProviderType.Gemini:
      return GeminiService.generateImagesInternal(prompt, numberOfImages);
    case AiProviderType.OpenAI:
      return OpenAICompatibleService.generateOpenAIImagesInternal(prompt, numberOfImages);
    default:
      const providerConfig = getProviderConfig(activeProviderType);
      const providerName = providerConfig?.name || activeProviderType;
      const imageModels = providerConfig?.models?.image;
      if (!imageModels || imageModels.length === 0) {
          return { images: null, error: `Image generation is not configured or typically supported by ${providerName} in this client-side application.`};
      }
      const res = handleNonImplementedProvider(activeProviderType, "Image generation");
      return { images: null, error: res.error };
  }
};

export const generateTextStream = async (
  prompt: string,
  onStreamChunk: (chunkText: string) => void,
  onStreamComplete: (fullText: string) => void,
  onError: (error: string) => void,
  systemInstruction?: string
): Promise<void> => {
  const activeProviderType = getActiveAiProviderType();

  switch (activeProviderType) {
    case AiProviderType.Gemini:
      return GeminiService.generateTextStreamInternal(prompt, onStreamChunk, onStreamComplete, onError, systemInstruction);
    case AiProviderType.OpenAI:
    case AiProviderType.Deepseek:
    case AiProviderType.Groq:
      return OpenAICompatibleService.generateTextStreamInternal(activeProviderType, prompt, onStreamChunk, onStreamComplete, onError, systemInstruction);
    default:
      const res = handleNonImplementedProvider(activeProviderType, "Streaming text generation");
      onError(res.error);
  }
};
