import React, { useCallback } from 'react';
import { useAppDataContext } from '../MainAppLayout';
import { ViewName, Persona, AdminPersona } from '../../types';
import { PrerequisiteMessageCard } from '../ui/PrerequisiteMessageCard';
import { ChatSidebar } from './ChatSidebar';
import { ChatArea } from './ChatArea';
import { WelcomeScreen } from './WelcomeScreen';
import { useAIAgentChat } from './hooks/useAIAgentChat';
import { InsightsPanel } from './InsightsPanel';
import { useToast } from '../ui/ToastProvider';

export const AIAgentsView: React.FC = () => {
    const { currentUser, personas, adminPersonas, handlers: appDataHandlers, onNavigate } = useAppDataContext();
    const { showToast } = useToast();
    
    const {
        state,
        handlers,
        chatHelpers
    } = useAIAgentChat(currentUser, personas);

    const {
        chatSessions,
        activeSessionId,
        isLoadingSessions,
        activePersona,
        insights,
        isGeneratingInsights
    } = state;
    
    const handleImportAndStartChat = useCallback(async (adminPersona: AdminPersona) => {
        // 1. Check if this admin persona has already been imported by the user
        const existingPersona = personas.find(p => p.source_admin_persona_id === adminPersona.id);

        if (existingPersona) {
            // If it exists, just start a new chat with it
            showToast(`Starting chat with your existing agent: ${existingPersona.name}`, 'info');
            handlers.handleNewChat(existingPersona);
        } else {
            // 2. If not, import it
            showToast(`Importing ${adminPersona.name} to your agents...`, 'info');
            
            const { data: newPersona, error } = await appDataHandlers.addPersona({
                ...(adminPersona as any),
                source_admin_persona_id: adminPersona.id,
            });

            if (error) {
                showToast(`Failed to import agent: ${error.message}`, 'error');
            } else if (newPersona) {
                showToast(`Agent ${newPersona.name} imported successfully!`, 'success');
                // The persona list will update via subscription. We can start a chat right away.
                handlers.handleNewChat(newPersona);
            }
        }
    }, [personas, handlers, appDataHandlers, showToast]);


    if (personas.length === 0 && adminPersonas.length === 0) {
        return (
            <PrerequisiteMessageCard
                title="Create a Persona to Begin"
                message="AI Agents are powered by your audience personas. Please create at least one persona in the 'Audience Modeling' section to start chatting."
                action={{ label: "Go to Audience Modeling", onClick: () => onNavigate(ViewName.AudienceModeling) }}
            />
        );
    }

    return (
        <div className="flex h-[calc(100vh-10rem)] bg-card border border-border rounded-lg overflow-hidden shadow-2xl">
            <ChatSidebar
                personas={personas}
                adminPersonas={adminPersonas}
                sessions={chatSessions}
                activeSessionId={activeSessionId}
                isLoading={isLoadingSessions}
                onSelectSession={handlers.handleSelectSession}
                onNewChat={handlers.handleNewChat}
                onDeleteSession={handlers.handleDeleteSession}
                onImportAdminPersona={handleImportAndStartChat}
            />
            <div className="flex-1 flex overflow-hidden">
                {activePersona ? (
                    <ChatArea
                        currentUser={currentUser}
                        personas={personas}
                        activePersona={activePersona}
                        chatState={state}
                        chatHandlers={handlers}
                        chatHelpers={chatHelpers}
                    />
                ) : (
                    <WelcomeScreen 
                        personas={[...personas, ...adminPersonas]}
                        onSelectPersona={(p) => {
                            if ('user_id' in p) {
                                handlers.handleSetActivePersona(p);
                            } else {
                                handleImportAndStartChat(p as AdminPersona);
                            }
                        }}
                        activePersona={activePersona}
                    />
                )}
                <InsightsPanel 
                    insights={insights}
                    onGenerate={handlers.handleGenerateInsights}
                    isLoading={isGeneratingInsights}
                />
            </div>
        </div>
    );
};