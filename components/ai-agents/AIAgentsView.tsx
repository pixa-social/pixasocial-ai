import React from 'react';
import { useAppDataContext } from '../MainAppLayout';
import { ViewName } from '../../types';
import { PrerequisiteMessageCard } from '../ui/PrerequisiteMessageCard';
import { ChatSidebar } from './ChatSidebar';
import { ChatArea } from './ChatArea';
import { WelcomeScreen } from './WelcomeScreen';
import { useAIAgentChat } from './hooks/useAIAgentChat';
import { InsightsPanel } from './InsightsPanel';

export const AIAgentsView: React.FC = () => {
    const { currentUser, personas, onNavigate } = useAppDataContext();
    
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

    if (personas.length === 0) {
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
                sessions={chatSessions}
                activeSessionId={activeSessionId}
                isLoading={isLoadingSessions}
                onSelectSession={handlers.handleSelectSession}
                onNewChat={handlers.handleNewChat}
                onDeleteSession={handlers.handleDeleteSession}
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
                        personas={personas} 
                        onSelectPersona={handlers.handleSetActivePersona}
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