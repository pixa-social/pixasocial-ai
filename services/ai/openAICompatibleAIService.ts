
import OpenAI, { ClientOptions } from "openai";
import { AiProviderType, AIParsedJsonResponse } from "../../types";
import { getProviderConfig, parseJsonFromText } from './aiUtils';

const openAICompatibleClients: Record<string, OpenAI> = {};

const getOpenAICompatibleClientInstance = async (providerType: AiProviderType, apiKey: string): Promise<OpenAI | null> => {
    const config = await getProviderConfig(providerType);
    if (!config || !config.is_enabled) {
        console.warn(`${providerType} provider is not configured or not enabled.`);
        return null;
    }

    const baseURL = config.base_url;
    if (!baseURL && providerType !== AiProviderType.OpenAI) {
        console.warn(`Base URL for ${providerType} not configured.`);
        return null;
    }

    const clientCacheKey = `${providerType}-${apiKey}-${baseURL || 'default'}`;
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

export const generateTextInternal = async (
  providerType: AiProviderType,
  apiKey: string,
  modelName: string,
  prompt: string,
  systemInstruction?: string
): Promise<{ text: string | null; error?: string }> => {
  const ai = await getOpenAICompatibleClientInstance(providerType, apiKey);
  if (!ai) return { text: null, error: `${providerType} API client not initialized or API key/baseURL missing/invalid.` };
  
  try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
      messages.push({ role: "user", content: prompt });

      const response = await ai.chat.completions.create({ model: modelName, messages: messages });
      return { text: response.choices?.[0]?.message?.content || null };
  } catch (error) {
      console.error(`${providerType} API error (generateTextInternal):`, error);
      return { text: null, error: (error as Error).message };
  }
};

export const generateJsonInternal = async <T,>(
  providerType: AiProviderType,
  apiKey: string,
  modelName: string,
  prompt: string,
  systemInstruction?: string
): Promise<AIParsedJsonResponse<T>> => {
  const ai = await getOpenAICompatibleClientInstance(providerType, apiKey);
  if (!ai) return { data: null, error: `${providerType} API client not initialized.` };

  try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
      messages.push({ role: "user", content: `${prompt}\n\nReturn your response as a valid JSON object.` });

      const response = await ai.chat.completions.create({ 
          model: modelName, 
          messages: messages,
          response_format: { type: "json_object" } 
      });
      const responseText = response.choices?.[0]?.message?.content;
      if (!responseText) return {data: null, error: `${providerType} returned no content for JSON.`};
      
      return parseJsonFromText<T>(responseText);
  } catch (error) {
      console.error(`${providerType} API error (generateJsonInternal):`, error);
      if (error instanceof Error && error.message.includes("response_format")) {
           return { data: null, error: `The selected ${providerType} model '${modelName}' may not support a forced JSON response format. Try a different model or adjust the prompt. Error: ${error.message}` };
      }
      return { data: null, error: (error as Error).message };
  }
};

export const generateOpenAIImagesInternal = async (
  prompt: string,
  apiKey: string,
  modelName: string,
  numberOfImages: number = 1,
): Promise<{ images: string[] | null; error?: string }> => {
  const ai = await getOpenAICompatibleClientInstance(AiProviderType.OpenAI, apiKey);
  if (!ai) return { images: null, error: "OpenAI API client not initialized for DALL-E." };
  
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
      console.error("OpenAI DALL-E API error (generateOpenAIImagesInternal):", error);
      return { images: null, error: (error as Error).message };
  }
};

export const generateTextStreamInternal = async (
  providerType: AiProviderType,
  apiKey: string,
  modelName: string,
  prompt: string,
  onStreamChunk: (chunkText: string) => void,
  onStreamComplete: (fullText: string) => void,
  onError: (error: string) => void,
  systemInstruction?: string
): Promise<void> => {
  const ai = await getOpenAICompatibleClientInstance(providerType, apiKey);
  if (!ai) { onError(`${providerType} API client not initialized.`); return; }
  
  try {
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
      if (systemInstruction) messages.push({ role: "system", content: systemInstruction });
      messages.push({ role: "user", content: prompt });

      const stream = await ai.chat.completions.create({ model: modelName, messages: messages, stream: true });
      let fullTextResponse = "";
      for await (const chunk of stream) {
          const chunkText = chunk.choices?.[0]?.delta?.content || "";
          if (chunkText) {
              onStreamChunk(chunkText);
              fullTextResponse += chunkText;
          }
      }
      onStreamComplete(fullTextResponse);
  } catch (error) {
      onError((error as Error).message || `Unknown error during ${providerType} streaming.`);
  }
};
