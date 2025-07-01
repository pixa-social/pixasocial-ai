import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { AiProviderConfig, AiProviderType } from '../types';
import { AI_PROVIDERS_CONFIG_TEMPLATE, LOCAL_STORAGE_AI_CONFIG_KEY, LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY } from '../constants';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon } from './ui/Icons'; 
import { useToast } from './ui/ToastProvider'; // Import useToast
import { getStoredAiProviderConfigs, getActiveAiProviderType } from '../services/ai/aiUtils'; // Updated import path

export const AdminPanelView: React.FC = () => {
  const { showToast } = useToast(); // Use the toast hook
  const [providerConfigs, setProviderConfigs] = useState<AiProviderConfig[]>([]);
  const [activeProvider, setActiveProvider] = useState<AiProviderType>(AiProviderType.Gemini);
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
  // Removed saveMessage state, will use toast directly

  const loadConfigs = useCallback(() => {
    // Use the utility function for loading configs
    const configsToUse = getStoredAiProviderConfigs();
    setProviderConfigs(configsToUse);

    // Use the utility function for getting active provider
    const currentActiveProvider = getActiveAiProviderType();
    setActiveProvider(currentActiveProvider);
    
    const initialShowState: Record<string, boolean> = {};
    configsToUse.forEach(p => initialShowState[p.id] = false);
    setShowApiKeys(initialShowState);
  }, []); // Removed showToast as it's not directly used here for loading

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleApiKeyChange = (id: AiProviderType, key: string) => {
    setProviderConfigs(prev =>
      prev.map(p => (p.id === id ? { ...p, apiKey: key } : p))
    );
  };
  
  const handleIsEnabledChange = (id: AiProviderType, isEnabled: boolean) => {
     setProviderConfigs(prev =>
      prev.map(p => (p.id === id ? { ...p, isEnabled } : p))
    );
    if (!isEnabled && activeProvider === id) {
        // Recalculate the next best active provider based on current (potentially modified) providerConfigs
        const currentConfigs = providerConfigs.map(p => (p.id === id ? { ...p, isEnabled } : p));
        const geminiStillEnabled = currentConfigs.find(p => p.id === AiProviderType.Gemini && p.isEnabled);
        if (geminiStillEnabled) {
            setActiveProvider(AiProviderType.Gemini);
        } else {
            const firstStillEnabled = currentConfigs.find(p => p.isEnabled && p.id !== id);
            setActiveProvider(firstStillEnabled ? firstStillEnabled.id : AiProviderType.Gemini); // Fallback to Gemini if no other enabled
        }
    }
  }

  const toggleShowApiKey = (id: AiProviderType) => {
    setShowApiKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveConfigs = () => {
    try {
      const configsToSave = providerConfigs.map(({ id, name, apiKey, isEnabled, isGemini, models, notes, baseURL }) => ({ 
        id, name, apiKey, isEnabled, isGemini, models, notes, baseURL
      }));
      localStorage.setItem(LOCAL_STORAGE_AI_CONFIG_KEY, JSON.stringify(configsToSave));
      
      const currentActiveConfig = providerConfigs.find(p => p.id === activeProvider);
      if (!currentActiveConfig || !currentActiveConfig.isEnabled) {
          // If current active provider is being disabled, find a new one
          const geminiConfig = providerConfigs.find(p => p.id === AiProviderType.Gemini && p.isEnabled);
          if (geminiConfig) {
              localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, AiProviderType.Gemini);
              setActiveProvider(AiProviderType.Gemini);
          } else {
              const firstEnabled = providerConfigs.find(p => p.isEnabled);
              if (firstEnabled) {
                  localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, firstEnabled.id);
                  setActiveProvider(firstEnabled.id);
              } else {
                   // If nothing is enabled, keep the current activeProvider value but it won't work
                   localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, activeProvider); 
                   showToast('Warning: No AI provider is enabled. AI features may not work.', 'error');
              }
          }
      } else {
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, activeProvider);
      }

      showToast('Configurations saved successfully!', 'success');
      loadConfigs(); 
    } catch (error) {
      console.error("Error saving AI configurations:", error);
      showToast('Failed to save configurations.', 'error');
    }
  };
  
  const isGeminiEnvKeyPresent = !!(typeof process !== 'undefined' && process.env && process.env.API_KEY);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Admin Panel: AI Provider Configuration</h2>

      <Card className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-700">API Key Security Warning</h3>
            <p className="text-yellow-600 text-sm">
              API keys entered here are stored in your browser's local storage.
              This is generally not secure for production environments.
              For Google Gemini, relying on the pre-configured environment variable is recommended if available.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Global AI Settings" className="mb-6">
        <Select
          label="Active AI Provider for All App Features"
          options={providerConfigs
            .filter(p => p.isEnabled)
            .map(p => ({ value: p.id, label: `${p.name} ${p.isGemini && isGeminiEnvKeyPresent && (!p.apiKey || p.apiKey === process.env.API_KEY) ? "(Env Key)" : ""}` }))
          }
          value={activeProvider}
          onChange={(e) => setActiveProvider(e.target.value as AiProviderType)}
          containerClassName="max-w-md"
        />
        <p className="text-xs text-textSecondary mt-1">
          Select the primary AI provider. Only enabled providers with valid API keys will function.
        </p>
      </Card>

      <div className="space-y-6">
        {providerConfigs.map(provider => {
          const usesEnvKeyForGemini = provider.isGemini && isGeminiEnvKeyPresent && (!provider.apiKey || provider.apiKey === process.env.API_KEY);
          return (
            <Card key={provider.id} title={`${provider.name} ${usesEnvKeyForGemini ? "(Using Environment Key)" : ""}`} >
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                   <input 
                      type="checkbox" 
                      id={`enable-${provider.id}`} 
                      checked={provider.isEnabled}
                      onChange={e => handleIsEnabledChange(provider.id, e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                      aria-labelledby={`label-enable-${provider.id}`}
                   />
                   <label htmlFor={`enable-${provider.id}`} id={`label-enable-${provider.id}`} className="text-sm font-medium text-textPrimary">
                      Enable {provider.name}
                   </label>
                </div>

                {provider.isEnabled && (
                  <>
                    <div className="relative">
                      <Input
                        label={`API Key for ${provider.name}`}
                        id={`apikey-${provider.id}`}
                        type={showApiKeys[provider.id] ? 'text' : 'password'}
                        value={ (provider.isGemini && provider.apiKey === process.env.API_KEY && isGeminiEnvKeyPresent) ? "" : provider.apiKey || ''}
                        onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                        placeholder={usesEnvKeyForGemini ? "Using pre-configured environment key" : "Enter API Key"}
                        containerClassName="mb-0"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowApiKey(provider.id)}
                        className="absolute right-3 top-9 text-textSecondary hover:text-textPrimary"
                        aria-label={showApiKeys[provider.id] ? `Hide ${provider.name} API key` : `Show ${provider.name} API key`}
                      >
                        {showApiKeys[provider.id] ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                      </button>
                    </div>
                     {provider.isGemini && isGeminiEnvKeyPresent && (
                      <p className="text-xs text-textSecondary">
                        An API key for Gemini is available via environment variable. You can paste a key above to override it. If this field is empty, the environment key will be used.
                      </p>
                    )}
                    {provider.notes && <p className="text-xs text-textSecondary italic mt-1">{provider.notes}</p>}
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      
      <div className="mt-8 flex flex-col items-center">
        <Button variant="primary" size="lg" onClick={handleSaveConfigs} className="w-full md:w-auto">
          Save All AI Configurations
        </Button>
      </div>
    </div>
  );
};
