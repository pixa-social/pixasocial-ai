import React, { useState, useCallback } from 'react';
import { Persona, Database } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';
import { PersonaForm } from '../audience-modeling/PersonaForm';
import { PersonaCard } from '../audience-modeling/PersonaCard';
import { useAppDataContext } from '../MainAppLayout';
import { supabase } from '../../services/supabaseClient';

type AdminPersona = Database['public']['Tables']['admin_personas']['Row'];

const dataURLtoBlob = (dataurl: string) => {
    const arr = dataurl.split(',');
    if (arr.length < 2) return null;
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
};


// Admin-specific handlers since they operate on a different table
const addAdminPersona = async (personaData: any) => {
    return supabase.from('admin_personas').insert(personaData).select().single();
};
const updateAdminPersona = async (id: number, personaData: any) => {
    return supabase.from('admin_personas').update(personaData).eq('id', id).select().single();
};
const deleteAdminPersona = async (id: number) => {
    return supabase.from('admin_personas').delete().eq('id', id);
};

export const AdminPersonasTab: React.FC = () => {
    const { currentUser, adminPersonas, fetchers } = useAppDataContext();
    const { showToast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [editingPersona, setEditingPersona] = useState<AdminPersona | undefined>(undefined);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateOrUpdate = async (personaData: Partial<Omit<Persona, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { name: string; avatar_base64?: string }) => {
        setIsSubmitting(true);
        
        const { user_id, avatar_base64, ...restOfData } = personaData as any;
        let payload = { ...restOfData };
        
        // Handle avatar upload if a new one is provided
        if (avatar_base64) {
            const blob = dataURLtoBlob(avatar_base64);
            if (blob) {
                const fileName = `admin_avatar_${Date.now()}.png`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, blob, { contentType: 'image/png', upsert: true });

                if (uploadError) {
                    showToast(`Avatar upload failed: ${uploadError.message}`, 'error');
                    setIsSubmitting(false);
                    return;
                }
                
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
                payload.avatar_url = urlData.publicUrl;
            }
        }
        
        const promise = editingPersona
            ? updateAdminPersona(editingPersona.id, payload)
            : addAdminPersona(payload);

        const { error } = await promise;

        if (error) {
            showToast(`Failed to save template persona: ${error.message}`, 'error');
        } else {
            showToast(`Template persona ${editingPersona ? 'updated' : 'created'} successfully.`, 'success');
            setShowForm(false);
            setEditingPersona(undefined);
            fetchers.fetchAdminPersonas(); // Refresh the list
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (personaId: number) => {
        if (window.confirm("Are you sure you want to delete this template persona for all users?")) {
            const { error } = await deleteAdminPersona(personaId);
            if (error) {
                showToast(`Failed to delete template: ${error.message}`, 'error');
            } else {
                showToast('Template persona deleted.', 'info');
                fetchers.fetchAdminPersonas();
            }
        }
    };
    
    const handleEdit = (persona: AdminPersona) => {
        setEditingPersona(persona);
        setShowForm(true);
    };

    return (
        <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-4">
                Manage the global library of AI Agent persona templates. These templates are visible to all users and can be imported into their personal AI Agents list.
            </p>
            
            {showForm ? (
                <Card title={editingPersona ? "Edit Template Persona" : "Create New Template Persona"}>
                    <PersonaForm
                        // We cast AdminPersona to Persona as they are structurally compatible for the form
                        initialPersona={editingPersona as Persona | undefined}
                        onSubmit={handleCreateOrUpdate}
                        onCancel={() => { setShowForm(false); setEditingPersona(undefined); }}
                        isLoading={isSubmitting}
                        currentUser={currentUser}
                    />
                </Card>
            ) : (
                <>
                    <Button onClick={() => setShowForm(true)} className="mb-6">Create New Template Persona</Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {adminPersonas.map(persona => (
                            <PersonaCard
                                key={persona.id}
                                persona={persona as Persona} // Cast for prop compatibility
                                onEdit={() => handleEdit(persona)}
                                onDelete={() => handleDelete(persona.id)}
                                currentUser={currentUser}
                                // Disable AI features for templates
                                onRefreshVulnerabilities={() => {}} 
                                isRefreshingVulnerabilities={false}
                                onDeepDiveRequest={() => {}}
                                isDiving={false}
                            />
                        ))}
                    </div>
                     {adminPersonas.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No template personas created yet.</p>
                    )}
                </>
            )}
        </div>
    );
};