import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select, SelectOption } from './ui/Select';
import { AiProviderConfig, AiProviderType, RoleType, RoleName, AdminUserView, Database, Json } from '../types';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon, ServerStackIcon, UsersIcon, ShieldCheckIcon } from './ui/Icons';
import { useToast } from './ui/ToastProvider';
import { getStoredAiProviderConfigs, getGlobalAiSettings } from '../services/ai/aiUtils';
import { Tabs, Tab } from './ui/Tabs';
import { supabase } from '../services/supabaseClient';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Textarea } from './ui/Textarea';
import { SeoSettingsTab } from './admin/SeoSettingsTab';
import { AI_PROVIDERS_CONFIG_TEMPLATE } from '../constants';
import { AdminPersonasTab } from './admin/AdminPersonasTab';

// --- AI Provider Config Tab ---
const AiProviderConfigTab: React.FC = () => {
    const { showToast } = useToast();
    const [providerConfigs, setProviderConfigs] = useState<AiProviderConfig[]>([]);
    const [activeProvider, setActiveProvider] = useState<AiProviderType>(AiProviderType.Gemini);
    const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [globalDefaultTextModel, setGlobalDefaultTextModel] = useState<string>('');
    const [globalDefaultImageModel, setGlobalDefaultImageModel] = useState<string>('');

    const loadConfigs = useCallback(async () => {
        setIsLoading(true);
        const configsToUse = await getStoredAiProviderConfigs(true); // Force refetch
        setProviderConfigs(configsToUse);

        const globalSettings = await getGlobalAiSettings(true); // Force refetch from DB
        setActiveProvider(globalSettings.active_ai_provider as AiProviderType || AiProviderType.Gemini);
        setGlobalDefaultTextModel(globalSettings.global_default_text_model || '');
        setGlobalDefaultImageModel(globalSettings.global_default_image_model || '');

        const initialShowState: Record<string, boolean> = {};
        configsToUse.forEach(p => initialShowState[p.id] = false);
        setShowApiKeys(initialShowState);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadConfigs();
    }, [loadConfigs]);

    const handleApiKeyChange = (id: AiProviderType, key: string) => {
        setProviderConfigs(prev => prev.map(p => (p.id === id ? { ...p, api_key: key } : p)));
    };
    
    const handleIsEnabledChange = (id: AiProviderType, is_enabled: boolean) => {
        setProviderConfigs(prev => prev.map(p => (p.id === id ? { ...p, is_enabled } : p)));
        // If the currently active provider is being disabled, fall back to Gemini or the first available one.
        if (!is_enabled && activeProvider === id) {
            const currentConfigs = providerConfigs.map(p => (p.id === id ? { ...p, is_enabled } : p));
            const geminiStillEnabled = currentConfigs.find(p => p.id === AiProviderType.Gemini && p.is_enabled);
            if (geminiStillEnabled) {
                setActiveProvider(AiProviderType.Gemini);
            } else {
                const firstStillEnabled = currentConfigs.find(p => p.is_enabled && p.id !== id);
                setActiveProvider(firstStillEnabled ? firstStillEnabled.id : AiProviderType.Gemini);
            }
        }
    };

    const toggleShowApiKey = (id: AiProviderType) => setShowApiKeys(prev => ({ ...prev, [id]: !prev[id] }));

    const handleModelListChange = (providerId: AiProviderType, modelType: 'text' | 'image' | 'chat', value: string) => {
        setProviderConfigs(prev => 
            prev.map(p => {
                if (p.id === providerId) {
                    const newModels = { ...p.models };
                    newModels[modelType] = value.split('\n').map(line => line.trim()).filter(line => line);
                    return { ...p, models: newModels };
                }
                return p;
            })
        );
    };

    const handleSaveConfigs = async () => {
        try {
            // Save provider-specific configs (API keys, enabled status, models)
            const upsertData: Database['public']['Tables']['ai_provider_global_configs']['Insert'][] = providerConfigs.map(({ id, name, api_key, is_enabled, models, notes, base_url }) => ({
                id, name, 
                api_key: api_key || null, 
                is_enabled, 
                models: models as unknown as Json, 
                notes: notes || null, 
                base_url: base_url || null, 
                updated_at: new Date().toISOString()
            }));

            const { error: providerConfigError } = await supabase.from('ai_provider_global_configs').upsert(upsertData, { onConflict: 'id' });
            if (providerConfigError) throw providerConfigError;

            // Save global app settings
            const globalSettingsPayload: Database['public']['Tables']['app_global_settings']['Update'] = {
                id: 1, // The table has a single row with id=1
                active_ai_provider: activeProvider,
                global_default_text_model: globalDefaultTextModel || null,
                global_default_image_model: globalDefaultImageModel || null,
                updated_at: new Date().toISOString()
            };
            const { error: globalSettingsError } = await supabase.from('app_global_settings').upsert(globalSettingsPayload, { onConflict: 'id' });
            if (globalSettingsError) throw globalSettingsError;

            const activeConfig = providerConfigs.find(p => p.id === activeProvider);
            if (!activeConfig || !activeConfig.is_enabled) {
                showToast(`Warning: The selected provider '${activeConfig?.name || activeProvider}' is currently disabled. The app will fall back to another enabled provider.`, 'error', 6000);
            }

            showToast('Global AI configurations saved successfully!', 'success');
            loadConfigs(); 
        } catch (error) {
            showToast(`Failed to save configurations: ${(error as Error).message}`, 'error');
        }
    };

    const allTextModelOptions = useMemo(() => {
        const options: SelectOption[] = [{ value: '', label: 'Active Provider Default' }];
        providerConfigs.forEach(provider => {
            const labelSuffix = provider.is_enabled ? '' : ' (Disabled)';
            provider.models?.text?.forEach(model => {
                options.push({ value: model, label: `${provider.name}: ${model}${labelSuffix}`});
            });
        });
        return options;
    }, [providerConfigs]);

    const allImageModelOptions = useMemo(() => {
        const options: SelectOption[] = [{ value: '', label: 'Active Provider Default' }];
        providerConfigs.forEach(provider => {
            const labelSuffix = provider.is_enabled ? '' : ' (Disabled)';
            provider.models?.image?.forEach(model => {
                options.push({ value: model, label: `${provider.name}: ${model}${labelSuffix}`});
            });
        });
        return options;
    }, [providerConfigs]);
    
    if (isLoading) return <LoadingSpinner text="Loading AI provider configurations..." className="mt-8" />;

    return (
        <div className="mt-4">
            <Card className="mb-6 bg-yellow-500/10 border-l-4 border-yellow-400 p-4">
                <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400 mr-3 shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-300">API Key & Model Management</h3>
                        <p className="text-yellow-400 text-sm">API keys are stored in the database. Ensure RLS policies protect this data. Model lists are now managed here and saved to the database, overriding hardcoded defaults.</p>
                    </div>
                </div>
            </Card>

            <Card title="Global AI Settings" className="mb-6">
                <Select
                    label="Active AI Provider for All App Features"
                    options={providerConfigs.filter(p => p.is_enabled).map(p => ({ value: p.id, label: p.name }))}
                    value={activeProvider}
                    onChange={(e) => setActiveProvider(e.target.value as AiProviderType)}
                    containerClassName="max-w-md"
                />
                 <p className="text-xs text-muted-foreground mt-1 italic">Sets the default provider if no global model or user-specific model is assigned.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <Select
                        label="Default Text Model (Overrides Active Provider)"
                        options={allTextModelOptions}
                        value={globalDefaultTextModel}
                        onChange={(e) => setGlobalDefaultTextModel(e.target.value)}
                        containerClassName="mb-0"
                    />
                    <Select
                        label="Default Image Model (Overrides Active Provider)"
                        options={allImageModelOptions}
                        value={globalDefaultImageModel}
                        onChange={(e) => setGlobalDefaultImageModel(e.target.value)}
                        containerClassName="mb-0"
                    />
                </div>
                 <p className="text-xs text-muted-foreground mt-1 italic">This sets a specific default model for all users, overriding the general 'Active Provider' setting. User-specific assignments still take highest priority.</p>
            </Card>

            <div className="space-y-6">
                {providerConfigs.map(provider => {
                    const providerTemplate = AI_PROVIDERS_CONFIG_TEMPLATE.find(t => t.id === provider.id);
                    return (
                    <Card key={provider.id} title={provider.name}>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                               <input type="checkbox" id={`enable-${provider.id}`} checked={provider.is_enabled} onChange={e => handleIsEnabledChange(provider.id, e.target.checked)} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                               <label htmlFor={`enable-${provider.id}`} className="text-sm font-medium text-textPrimary">Enable {provider.name}</label>
                            </div>
                            {provider.is_enabled && (
                                <>
                                    <div className="relative">
                                        <Input label={`API Key for ${provider.name}`} id={`apikey-${provider.id}`} type={showApiKeys[provider.id] ? 'text' : 'password'} value={provider.api_key || ''} onChange={(e) => handleApiKeyChange(provider.id, e.target.value)} placeholder="Enter Global API Key" containerClassName="mb-0" />
                                        <button type="button" onClick={() => toggleShowApiKey(provider.id)} className="absolute right-3 top-9 text-textSecondary hover:text-textPrimary">
                                            {showApiKeys[provider.id] ? <EyeSlashIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                                        </button>
                                    </div>
                                    {provider.notes && <p className="text-xs text-muted-foreground italic mt-1">{provider.notes}</p>}
                                    <div className="mt-4 pt-4 border-t border-border">
                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Editable Model Lists</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {providerTemplate?.models.text && (
                                                <Textarea 
                                                    label="Text Models (one per line)"
                                                    value={(provider.models.text || []).join('\n')}
                                                    onChange={(e) => handleModelListChange(provider.id, 'text', e.target.value)}
                                                    rows={5}
                                                    className="font-mono text-xs"
                                                    containerClassName="mb-0"
                                                />
                                            )}
                                            {providerTemplate?.models.image && (
                                                <Textarea 
                                                    label="Image Models (one per line)"
                                                    value={(provider.models.image || []).join('\n')}
                                                    onChange={(e) => handleModelListChange(provider.id, 'image', e.target.value)}
                                                    rows={5}
                                                    className="font-mono text-xs"
                                                    containerClassName="mb-0"
                                                />
                                            )}
                                            {providerTemplate?.models.chat && (
                                                <Textarea 
                                                    label="Chat Models (one per line)"
                                                    value={(provider.models.chat || []).join('\n')}
                                                    onChange={(e) => handleModelListChange(provider.id, 'chat', e.target.value)}
                                                    rows={5}
                                                    className="font-mono text-xs"
                                                    containerClassName="mb-0"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                )})}
            </div>
            <div className="mt-8 flex justify-center"><Button variant="primary" size="lg" onClick={handleSaveConfigs}>Save All AI Configurations</Button></div>
        </div>
    );
};

// --- User Management Tab ---
const UserManagementTab: React.FC = () => {
    const { showToast } = useToast();
    const [users, setUsers] = useState<AdminUserView[]>([]);
    const [roles, setRoles] = useState<RoleType[]>([]);
    const [aiConfigs, setAiConfigs] = useState<AiProviderConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        const { data: usersData, error: usersError } = await supabase.from('admin_users_view').select('*');
        const { data: rolesData, error: rolesError } = await supabase.from('role_types').select('*');
        const configs = await getStoredAiProviderConfigs(true);

        if (usersError) showToast(`Error fetching users: ${usersError.message}`, 'error');
        else setUsers(usersData as AdminUserView[] || []);

        if (rolesError) showToast(`Error fetching roles: ${rolesError.message}`, 'error');
        else setRoles(rolesData || []);

        setAiConfigs(configs);
        setIsLoading(false);
    }, [showToast]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleRoleChange = async (userId: string, newRoleName: RoleName) => {
        const newRole = roles.find(r => r.name === newRoleName);
        if (!newRole) {
            showToast(`Role '${newRoleName}' not found.`, 'error');
            return;
        }

        const updatePayload: Database['public']['Tables']['user_roles']['Update'] = {
            role_id: newRole.id,
            assigned_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('user_roles')
            .update(updatePayload)
            .eq('user_id', userId);
        
        if (error) {
            showToast(`Failed to update role: ${error.message}`, 'error');
        } else {
            showToast(`User role updated to ${newRoleName}`, 'success');
            fetchAllData(); // Refresh data
        }
    };

    const handleModelChange = async (userId: string, modelType: 'text' | 'image', modelName: string) => {
        const fieldToUpdate: 'assigned_ai_model_text' | 'assigned_ai_model_image' = modelType === 'text' ? 'assigned_ai_model_text' : 'assigned_ai_model_image';
        
        const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
            [fieldToUpdate]: modelName || null
        };

        const { error } = await supabase.from('profiles').update(updatePayload).eq('id', userId);
        
        if (error) {
            showToast(`Failed to update model assignment: ${error.message}`, 'error');
        } else {
            showToast(`User's ${modelType} model updated.`, 'success');
            fetchAllData();
        }
    };
    
    const textModelOptions = useMemo(() => {
        const options: SelectOption[] = [{ value: '', label: 'Global Default' }];
        aiConfigs.forEach(provider => {
            provider.models?.text?.forEach(model => {
                options.push({ value: model, label: `${provider.name}: ${model}`});
            });
        });
        return options;
    }, [aiConfigs]);

    const imageModelOptions = useMemo(() => {
        const options: SelectOption[] = [{ value: '', label: 'Global Default' }];
        aiConfigs.forEach(provider => {
            provider.models?.image?.forEach(model => {
                options.push({ value: model, label: `${provider.name}: ${model}`});
            });
        });
        return options;
    }, [aiConfigs]);


    if (isLoading) return <LoadingSpinner text="Loading users and roles..." className="mt-8" />;

    return (
        <Card title="Manage Users & Permissions" className="mt-4 bg-card text-textPrimary">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-card/60">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned Text Model</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned Image Model</th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-foreground">{user.name || 'N/A'}</div>
                                    <div className="text-sm text-muted-foreground">{user.email}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <Select 
                                        options={roles.map(r => ({ value: r.name, label: r.name }))}
                                        value={user.role_name || ''}
                                        onChange={e => handleRoleChange(user.id!, e.target.value as RoleName)}
                                        containerClassName="mb-0"
                                    />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <Select
                                        options={textModelOptions}
                                        value={user.assigned_ai_model_text || ''}
                                        onChange={(e) => handleModelChange(user.id!, 'text', e.target.value)}
                                        containerClassName="mb-0"
                                    />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                     <Select
                                        options={imageModelOptions}
                                        value={user.assigned_ai_model_image || ''}
                                        onChange={(e) => handleModelChange(user.id!, 'image', e.target.value)}
                                        containerClassName="mb-0"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// --- Pricing / Subscription Management Tab ---
const PricingManagementTab: React.FC = () => {
    const { showToast } = useToast();
    const [roles, setRoles] = useState<RoleType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingRoles, setEditingRoles] = useState<Record<string, Partial<RoleType>>>({});

    const fetchRoles = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('role_types').select('*').order('price_monthly');
        if (error) showToast(`Error fetching roles: ${error.message}`, 'error');
        else setRoles(data || []);
        setIsLoading(false);
    }, [showToast]);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    const handleFieldChange = (roleId: string, field: keyof RoleType, value: any) => {
        setEditingRoles(prev => ({
            ...prev,
            [roleId]: { ...prev[roleId], [field]: value }
        }));
    };

    const handleSaveRole = async (roleId: string) => {
        const roleToUpdate = roles.find(r => r.id === roleId);
        if (!roleToUpdate) return;
        const updates = editingRoles[roleId];
        if (!updates) {
            showToast("No changes to save.", "info");
            return;
        }

        const updatePayload: Database['public']['Tables']['role_types']['Update'] = {
            max_personas: updates.max_personas,
            max_ai_uses_monthly: updates.max_ai_uses_monthly,
            price_monthly: updates.price_monthly,
            price_yearly: updates.price_yearly,
            features: updates.features,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('role_types').update(updatePayload).eq('id', roleId);
        if (error) {
            showToast(`Failed to save role '${roleToUpdate.name}': ${error.message}`, 'error');
        } else {
            showToast(`Role '${roleToUpdate.name}' saved successfully.`, 'success');
            setEditingRoles(prev => {
                const newEditing = { ...prev };
                delete newEditing[roleId];
                return newEditing;
            });
            fetchRoles();
        }
    };

    if (isLoading) return <LoadingSpinner text="Loading subscription plans..." className="mt-8" />;
    
    return (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => {
                const editedRole = { ...role, ...editingRoles[role.id] };
                return (
                    <Card key={role.id} title={role.name} shadow="soft-lg" className="flex flex-col">
                        <div className="flex-grow space-y-3">
                            <Input label="Max Personas" type="number" value={editedRole.max_personas} onChange={e => handleFieldChange(role.id, 'max_personas', parseInt(e.target.value) || 0)} containerClassName="mb-0" />
                            <Input label="Monthly AI Uses" type="number" value={editedRole.max_ai_uses_monthly} onChange={e => handleFieldChange(role.id, 'max_ai_uses_monthly', parseInt(e.target.value) || 0)} containerClassName="mb-0" />
                            <Input label="Monthly Price ($)" type="number" value={editedRole.price_monthly} onChange={e => handleFieldChange(role.id, 'price_monthly', parseFloat(e.target.value) || 0)} containerClassName="mb-0" />
                            <Textarea label="Features (one per line)" value={(editedRole.features || []).join('\n')} onChange={e => handleFieldChange(role.id, 'features', e.target.value.split('\n'))} rows={4} containerClassName="mb-0" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-border">
                             <Button variant="primary" onClick={() => handleSaveRole(role.id)} className="w-full" disabled={!editingRoles[role.id]}>Save Changes</Button>
                        </div>
                    </Card>
                )
            })}
        </div>
    );
};


export const AdminPanelView: React.FC = () => {
    return (
        <div className="p-6">
            <h2 className="text-3xl font-bold text-textPrimary mb-6">Admin Panel</h2>
            <Tabs>
                <Tab label="AI Providers" icon={<ServerStackIcon className="w-5 h-5"/>}>
                    <AiProviderConfigTab />
                </Tab>
                 <Tab label="Agent Personas" icon={<UsersIcon className="w-5 h-5"/>}>
                    <AdminPersonasTab />
                </Tab>
                <Tab label="User Management" icon={<UsersIcon className="w-5 h-5" />}>
                    <UserManagementTab />
                </Tab>
                <Tab label="Pricing & Subscriptions" icon={<WrenchScrewdriverIcon className="w-5 h-5" />}>
                    <PricingManagementTab />
                </Tab>
                 <Tab label="SEO & Analytics" icon={<ShieldCheckIcon className="w-5 h-5" />}>
                    <SeoSettingsTab />
                </Tab>
            </Tabs>
        </div>
    );
};