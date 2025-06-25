import { GoogleGenAI, GenerateContentResponse, GenerateContentParameters, GenerateImagesResponse } from "@google/genai";
import OpenAI, { ClientOptions } from "openai";

import { LOCAL_STORAGE_AI_CONFIG_KEY, LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, AI_PROVIDERS_CONFIG_TEMPLATE } from '../constants';
import { AIParsedJsonResponse, GroundingChunk, AiProviderType, AiProviderConfig } from "../types";

// --- Helper functions to manage AI provider configurations ---
export const getStoredAiProviderConfigs = (): AiProviderConfig[] => {
  const stored = localStorage.getItem(LOCAL_STORAGE_AI_CONFIG_KEY);
  if (stored) {
    try {
      const parsedConfigs = JSON.parse(stored) as AiProviderConfig[];
      const configsWithDefaults = AI_PROVIDERS_CONFIG_TEMPLATE.map(templateConfig => {
        const storedConfig = parsedConfigs.find(sc => sc.id === templateConfig.id);
        return storedConfig ? { ...templateConfig, ...storedConfig } : templateConfig;
      });
      return configsWithDefaults;
    } catch (e) {
      console.error("Error parsing stored AI configs, returning template:", e);
      return AI_PROVIDERS_CONFIG_TEMPLATE;
    }
  }
  return AI_PROVIDERS_CONFIG_TEMPLATE;
};

export const getActiveAiProviderType = (): AiProviderType => {
  const activeProviderId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY) as AiProviderType;
  const configs = getStoredAiProviderConfigs();
  const activeConfig = configs.find(c => c.id === activeProviderId && c.isEnabled);

  if (activeConfig) {
    return activeConfig.id;
  }
  const geminiConfig = configs.find(c => c.id === AiProviderType.Gemini && c.isEnabled);
  if (geminiConfig) return AiProviderType.Gemini;
  
  const firstEnabled = configs.find(c => c.isEnabled);
  if (firstEnabled) return firstEnabled.id;
  
  return AiProviderType.Gemini; // Fallback, though AdminPanel tries to ensure active is enabled
};

const getProviderConfig = (providerType: AiProviderType): AiProviderConfig | undefined => {
    const configs = getStoredAiProviderConfigs();
    return configs.find(c => c.id === providerType);
};

const getApiKeyForProvider = (providerType: AiProviderType): string | null => {
  const config = getProviderConfig(providerType);
  if (!config || !config.isEnabled) return null;

  if (providerType === AiProviderType.Gemini) {
    // For Gemini, prioritize explicitly set key in config, then env var
    if (config.apiKey && config.apiKey.trim() !== "") return config.apiKey;
    return process.env.API_KEY || null; 
  }
  return config.apiKey || null;
};

// --- AI Client Initialization (Dynamic) ---
let googleGenAiClient: GoogleGenAI | null = null;
let currentGeminiApiKey: string | null = null;

// Store for OpenAI-compatible clients, keyed by provider ID or a unique key based on API key + baseURL
const openAICompatibleClients: Record<string, OpenAI> = {};

const getGoogleGenAiClientInstance = (): GoogleGenAI | null => {
  const geminiApiKey = getApiKeyForProvider(AiProviderType.Gemini);
  if (!geminiApiKey) {
    if (googleGenAiClient) googleGenAiClient = null; // Clear instance if key removed
    currentGeminiApiKey = null;
    console.warn("Gemini API key not found. Gemini features will be disabled.");
    return null;
  }
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

const getOpenAICompatibleClient = (providerType: AiProviderType): OpenAI | null => {
    const config = getProviderConfig(providerType);
    if (!config || !config.isEnabled) {
        console.warn(`${providerType} provider is not configured or not enabled.`);
        return null;
    }

    const apiKey = getApiKeyForProvider(providerType); // This already checks isEnabled
    const baseURL = config.baseURL;

    if (!apiKey) {
        console.warn(`API key for ${providerType} not found.`);
        return null;
    }
     if (!baseURL && providerType !== AiProviderType.OpenAI) { // OpenAI can use default SDK baseURL
        console.warn(`Base URL for ${providerType} not configured.`);
        return null;
    }

    const clientCacheKey = `${providerType}-${apiKey}-${baseURL}`;

    if (openAICompatibleClients[clientCacheKey]) {
        return openAICompatibleClients[clientCacheKey];
    }

    try {
        const clientOptions: ClientOptions = { apiKey, dangerouslyAllowBrowser: true };
        if (baseURL) {
            clientOptions.baseURL = baseURL;
        }
        const newClient = new OpenAI(clientOptions);
        openAICompatibleClients[clientCacheKey] = newClient;
        return newClient;
    } catch (e) {
        console.error(`Failed to initialize OpenAI-compatible client for ${providerType}:`, e);
        return null;
    }
};


// --- Generic AI Service Functions ---

const parseJsonFromText = <T,>(text: string): AIParsedJsonResponse<T> => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    const parsedData = JSON.parse(jsonStr);
    return { data: parsedData };
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original text:", text);
    return { data: null, error: `Failed to parse JSON: ${(e as Error).message}. Original text: ${text.slice(0,100)}...` };
  }
};

const handleNonImplementedProvider = (providerType: AiProviderType, feature: string = "AI"): { error: string } => {
  const providerConfig = getProviderConfig(providerType);
  const errorMsg = `${feature} features for '${providerConfig?.name || providerType}' are not implemented or supported client-side. Select a different provider or update aiService.ts.`;
  console.warn(errorMsg);
  return { error: errorMsg };
};

const getModelForProvider = (providerType: AiProviderType, modelType: 'text' | 'image' | 'chat'): string | null => {
    const config = getProviderConfig(providerType);
    if (!config || !config.isEnabled) return null;
    
    const models = config.models[modelType];
    if (models && models.length > 0) {
        return models[0]; // Default to the first model in the list
    }
    if (modelType === 'chat' && config.models.text && config.models.text.length > 0) { // Fallback for chat
        return config.models.text[0];
    }
    if (modelType === 'text' && config.models.chat && config.models.chat.length > 0) { // Fallback for text
        return config.models.chat[0];
    }
    console.warn(`No suitable ${modelType} model found for provider ${providerType} in configuration.`);
    return null;
}

// --- Unified Text Generation ---
export const generateText = async (
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; groundingChunks?: GroundingChunk[] }> => {
  const activeProviderType = getActiveAiProviderType();
  
  if (activeProviderType === AiProviderType.Gemini) {
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
      console.error(`Gemini API error (generateText):`, error);
      return { text: null, error: (error as Error).message };
    }
  } else if (activeProviderType === AiProviderType.OpenAI || activeProviderType === AiProviderType.Deepseek || activeProviderType === AiProviderType.Groq) {
    const ai = getOpenAICompatibleClient(activeProviderType);
    const modelName = getModelForProvider(activeProviderType, 'chat');
    if (!ai) return { text: null, error: `${activeProviderType} API client not initialized or API key/baseURL missing/invalid.` };
    if (!modelName) return { text: null, error: `${activeProviderType} chat/text model not configured.` };
    try {
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
        if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
        messages.push({ role: "user", content: prompt });

        const response = await ai.chat.completions.create({ model: modelName, messages: messages });
        return { text: response.choices[0]?.message?.content || null };
    } catch (error) {
        console.error(`${activeProviderType} API error (generateText):`, error);
        return { text: null, error: (error as Error).message };
    }
  } else {
    const res = handleNonImplementedProvider(activeProviderType, "Text generation");
    return { text: null, error: res.error };
  }
};

export const generateTextWithGoogleSearch = async (
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string; groundingChunks?: GroundingChunk[] }> => {
  const activeProviderType = getActiveAiProviderType();

  if (activeProviderType === AiProviderType.Gemini) {
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
      console.error("Gemini API error (generateTextWithGoogleSearch):", error);
      return { text: null, error: (error as Error).message };
    }
  } else {
    console.warn(`Google Search grounding is a Gemini-specific feature. ${activeProviderType} does not support it.`);
    return { text: null, error: `Google Search grounding is only available for Gemini. Current provider: ${activeProviderType}` };
  }
};

export const generateJson = async <T,>(
  prompt: string,
  systemInstruction?: string
): Promise<AIParsedJsonResponse<T> & { groundingChunks?: GroundingChunk[] }> => {
  const activeProviderType = getActiveAiProviderType();

  if (activeProviderType === AiProviderType.Gemini) {
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
      console.error("Gemini API error (generateJson):", error);
      return { data: null, error: (error as Error).message };
    }
  } else if (activeProviderType === AiProviderType.OpenAI || activeProviderType === AiProviderType.Deepseek || activeProviderType === AiProviderType.Groq) {
    const ai = getOpenAICompatibleClient(activeProviderType);
    const modelName = getModelForProvider(activeProviderType, 'chat');
    if (!ai) return { data: null, error: `${activeProviderType} API client not initialized.` };
    if (!modelName) return { data: null, error: `${activeProviderType} chat model not configured for JSON.` };
    try {
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
        if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
        messages.push({ role: "user", content: `${prompt}\n\nReturn your response as a valid JSON object.` });

        const response = await ai.chat.completions.create({ 
            model: modelName, 
            messages: messages,
            response_format: { type: "json_object" } 
        });
        const responseText = response.choices[0]?.message?.content;
        if (!responseText) return {data: null, error: `${activeProviderType} returned no content for JSON.`};
        
        const parsed = parseJsonFromText<T>(responseText);
        return parsed;
    } catch (error) {
        console.error(`${activeProviderType} API error (generateJson):`, error);
        // Check for specific error messages related to JSON mode not supported by model
        if (error instanceof Error && error.message.includes("response_format")) {
             return { data: null, error: `The selected ${activeProviderType} model '${modelName}' may not support a forced JSON response format. Try a different model or adjust the prompt. Error: ${error.message}` };
        }
        return { data: null, error: (error as Error).message };
    }
  } else {
    const res = handleNonImplementedProvider(activeProviderType, "JSON generation");
    return { data: null, error: res.error };
  }
};

export const generateImages = async (
  prompt: string,
  numberOfImages: number = 1,
): Promise<{ images: string[] | null; error?: string }> => {
  const activeProviderType = getActiveAiProviderType();

  if (activeProviderType === AiProviderType.Gemini) {
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
      console.error("Gemini API error (generateImages):", error);
      return { images: null, error: (error as Error).message };
    }
  } else if (activeProviderType === AiProviderType.OpenAI) { // Only OpenAI has DALL-E directly in this setup
    const ai = getOpenAICompatibleClient(AiProviderType.OpenAI); // Specifically OpenAI for DALL-E
    const modelName = getModelForProvider(AiProviderType.OpenAI, 'image');
    if (!ai) return { images: null, error: "OpenAI API client not initialized for DALL-E." };
    if (!modelName) return { images: null, error: "OpenAI image model (e.g., DALL-E) not configured." };
    try {
        const response = await ai.images.generate({
            model: modelName,
            prompt: prompt,
            n: numberOfImages,
            size: "1024x1024", 
            response_format: "b64_json", 
        });
        if (response.data && response.data.length > 0) {
            const base64Images = response.data.map(img => img.b64_json).filter(b64 => b64 !== undefined) as string[];
            return { images: base64Images };
        }
        return { images: [], error: "No images generated or unexpected response from OpenAI DALL-E." };
    } catch (error) {
        console.error("OpenAI DALL-E API error (generateImages):", error);
        return { images: null, error: (error as Error).message };
    }
  }
  else { // Deepseek, Groq, Anthropic, Qwen generally don't offer image generation this way client-side
    const providerConfig = getProviderConfig(activeProviderType);
    const providerName = providerConfig?.name || activeProviderType;
    const imageModels = providerConfig?.models?.image;
    if (!imageModels || imageModels.length === 0) {
        return { images: null, error: `Image generation is not configured or typically supported by ${providerName} in this client-side application.`};
    }
    // If an image model IS configured, it means it might be a placeholder or future support
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

  if (activeProviderType === AiProviderType.Gemini) {
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
        if (chunk && typeof chunk.text === 'string') {
          onStreamChunk(chunk.text);
          fullTextResponse += chunk.text;
        }
      }
      onStreamComplete(fullTextResponse || ""); 
    } catch (error) {
      onError((error as Error).message || "Unknown error during Gemini streaming.");
    }
  } else if (activeProviderType === AiProviderType.OpenAI || activeProviderType === AiProviderType.Deepseek || activeProviderType === AiProviderType.Groq) {
    const ai = getOpenAICompatibleClient(activeProviderType);
    const modelName = getModelForProvider(activeProviderType, 'chat');
    if (!ai) { onError(`${activeProviderType} API client not initialized.`); return; }
    if (!modelName) { onError(`${activeProviderType} chat model not configured for streaming.`); return; }
    try {
        const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
        if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
        messages.push({ role: "user", content: prompt });

        const stream = await ai.chat.completions.create({ model: modelName, messages: messages, stream: true });
        let fullTextResponse = "";
        for await (const chunk of stream) {
            const chunkText = chunk.choices[0]?.delta?.content || "";
            if (chunkText) {
                onStreamChunk(chunkText);
                fullTextResponse += chunkText;
            }
        }
        onStreamComplete(fullTextResponse);
    } catch (error) {
        onError((error as Error).message || `Unknown error during ${activeProviderType} streaming.`);
    }
  }
  else {
    const res = handleNonImplementedProvider(activeProviderType, "Streaming text generation");
    onError(res.error);
  }
};