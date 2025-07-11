
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select, SelectOption } from './ui/Select';
import { AiProviderConfig, AiProviderType, RoleType, RoleName, AdminUserView } from '../types';
import { LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY } from '../constants';
import { EyeIcon, EyeSlashIcon, ExclamationTriangleIcon, WrenchScrewdriverIcon, ServerStackIcon, UsersIcon } from './ui/Icons';
import { useToast } from './ui/ToastProvider';
import { getStoredAiProviderConfigs, getActiveAiProviderType } from '../services/ai/aiUtils';
import { Tabs, Tab } from './ui/Tabs';
import { supabase } from '../services/supabaseClient';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { Textarea } from './ui/Textarea';

// --- AI Provider Config Tab ---
const AiProviderConfigTab: React.FC = () => {
    const { showToast } = useToast();
    const [providerConfigs, setProviderConfigs] = useState<AiProviderConfig[]>([]);
    const [activeProvider, setActiveProvider] = useState<AiProviderType>(AiProviderType.Gemini);
    const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    const loadConfigs = useCallback(async () => {
        setIsLoading(true);
        const configsToUse = await getStoredAiProviderConfigs(true); // Force refetch
        setProviderConfigs(configsToUse);
        const currentActiveProvider = getActiveAiProviderType();
        setActiveProvider(currentActiveProvider);
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

    const handleSaveConfigs = async () => {
        try {
            const upsertData = providerConfigs.map(({ id, name, api_key, is_enabled, models, notes, base_url }) => ({
                id, name, api_key, is_enabled, models, notes, base_url, updated_at: new Date().toISOString()
            }));

            const { error } = await supabase.from('ai_provider_global_configs').upsert(upsertData, { onConflict: 'id' });

            if (error) throw error;
            
            // This part for active provider remains client-side preference
            const currentActiveConfig = providerConfigs.find(p => p.id === activeProvider);
            if (!currentActiveConfig || !currentActiveConfig.is_enabled) {
                const geminiConfig = providerConfigs.find(p => p.id === AiProviderType.Gemini && p.is_enabled);
                const newActive = geminiConfig ? AiProviderType.Gemini : (providerConfigs.find(p => p.is_enabled)?.id || activeProvider);
                localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, newActive);
                setActiveProvider(newActive);
                if (!providerConfigs.some(p => p.is_enabled)) {
                    showToast('Warning: No AI provider is enabled.', 'error');
                }
            } else {
                localStorage.setItem(LOCAL_STORAGE_ACTIVE_AI_PROVIDER_KEY, activeProvider);
            }
            showToast('Global AI configurations saved successfully!', 'success');
            loadConfigs(); 
        } catch (error) {
            showToast(`Failed to save configurations: ${(error as Error).message}`, 'error');
        }
    };
    
    if (isLoading) return <LoadingSpinner text="Loading AI provider configurations..." className="mt-8" />;

    return (
        <div className="mt-4">
            <Card className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-start">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3 shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-semibold text-yellow-700">API Key Management</h3>
                        <p className="text-yellow-600 text-sm">API keys entered here are stored in the Supabase database. Ensure your database has appropriate security rules (RLS policies) to protect this data. These keys will be used for all users.</p>
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
                 <p className="text-xs text-textSecondary mt-1 italic">This sets the default provider for all users unless a specific model is assigned to them below.</p>
            </Card>

            <div className="space-y-6">
                {providerConfigs.map(provider => (
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
                                    {provider.notes && <p className="text-xs text-textSecondary italic mt-1">{provider.notes}</p>}
                                </>
                            )}
                        </div>
                    </Card>
                ))}
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
    const [aiModels, setAiModels] = useState<AiProviderConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        const { data: usersData, error: usersError } = await supabase.from('admin_users_view').select('*');
        const { data: rolesData, error: rolesError } = await supabase.from('role_types').select('*');
        const { data: modelsData, error: modelsError } = await supabase.from('ai_provider_global_configs').select('*');

        if (usersError) showToast(`Error fetching users: ${usersError.message}`, 'error');
        else setUsers(usersData as AdminUserView[] || []);

        if (rolesError) showToast(`Error fetching roles: ${rolesError.message}`, 'error');
        else setRoles(rolesData || []);

        if (modelsError) showToast(`Error fetching AI models: ${modelsError.message}`, 'error');
        else setAiModels(modelsData || []);

        setIsLoading(false);
    }, [showToast]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const handleRoleChange = async (userId: string, newRoleName: RoleName) => {
        const newRole = roles.find(r => r.name === newRoleName);
        if (!newRole) {
            showToast(`Role '${newRoleName}' not found.`, 'error');
            return;
        }

        const { error } = await supabase
            .from('user_roles')
            .update({ role_id: newRole.id, assigned_at: new Date().toISOString() })
            .eq('user_id', userId);
        
        if (error) {
            showToast(`Failed to update role: ${error.message}`, 'error');
        } else {
            showToast(`User role updated to ${newRoleName}`, 'success');
            fetchAllData(); // Refresh data
        }
    };

    const handleModelChange = async (userId: string, modelType: 'text' | 'image', modelName: string) => {
        const fieldToUpdate = modelType === 'text' ? 'assigned_ai_model_text' : 'assigned_ai_model_image';
        const { error } = await supabase.from('profiles').update({ [fieldToUpdate]: modelName }).eq('id', userId);
        
        if (error) {
            showToast(`Failed to update model assignment: ${error.message}`, 'error');
        } else {
            showToast(`User's ${modelType} model updated.`, 'success');
            fetchAllData();
        }
    };
    
    const textModelOptions = useMemo(() => {
        const options: SelectOption[] = [{ value: '', label: 'Provider Default' }];
        aiModels.forEach(provider => {
            provider.models?.text?.forEach(model => {
                options.push({ value: model, label: `${provider.name}: ${model}`});
            });
        });
        return options;
    }, [aiModels]);

    const imageModelOptions = useMemo(() => {
        const options: SelectOption[] = [{ value: '', label: 'Provider Default' }];
        aiModels.forEach(provider => {
            provider.models?.image?.forEach(model => {
                options.push({ value: model, label: `${provider.name}: ${model}`});
            });
        });
        return options;
    }, [aiModels]);


    if (isLoading) return <LoadingSpinner text="Loading users and roles..." className="mt-8" />;

    return (
        <Card title="Manage Users & Permissions" className="mt-4">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">User</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Role</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Assigned Text Model</th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Assigned Image Model</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-textPrimary">{user.name || 'N/A'}</div>
                                    <div className="text-sm text-textSecondary">{user.email}</div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <Select 
                                        options={roles.map(r => ({ value: r.name, label: r.name }))}
                                        value={user.role_name || ''}
                                        onChange={e => handleRoleChange(user.id, e.target.value as RoleName)}
                                        containerClassName="mb-0"
                                    />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <Select
                                        options={textModelOptions}
                                        value={user.assigned_ai_model_text || ''}
                                        onChange={(e) => handleModelChange(user.id, 'text', e.target.value)}
                                        containerClassName="mb-0"
                                    />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                     <Select
                                        options={imageModelOptions}
                                        value={user.assigned_ai_model_image || ''}
                                        onChange={(e) => handleModelChange(user.id, 'image', e.target.value)}
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

        const { error } = await supabase.from('role_types').update({...updates, updated_at: new Date().toISOString()}).eq('id', roleId);
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
                        <div className="mt-4 pt-4 border-t border-lightBorder">
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
                <Tab label="User Management" icon={<UsersIcon className="w-5 h-5" />}>
                    <UserManagementTab />
                </Tab>
                <Tab label="Pricing & Subscriptions" icon={<WrenchScrewdriverIcon className="w-5 h-5" />}>
                    <PricingManagementTab />
                </Tab>
            </Tabs>
        </div>
    );
};
