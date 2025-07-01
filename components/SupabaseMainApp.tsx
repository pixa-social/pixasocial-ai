import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '../hooks/useProfile';
import { usePersonas } from '../hooks/usePersonas';
import { useChat } from '../hooks/useChat';
import { Navbar } from './Navbar';
import { ViewName } from '../types';
import { DashboardView } from './DashboardView';
import { AudienceModelingView } from './AudienceModelingView';
import { ChatView } from './ChatView';
import { MethodologyView } from './MethodologyView';
import { AdminPanelView } from './AdminPanelView';
import { AuditToolView } from './AuditToolView';
import { FeedbackSimulatorView } from './FeedbackSimulatorView';
import { APP_TITLE } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useToast } from './ui/ToastProvider';

interface SupabaseMainAppProps {
  user: User;
  profile: Profile | null;
}

export const SupabaseMainApp: React.FC<SupabaseMainAppProps> = ({ user, profile }) => {
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const [currentView, setCurrentView] = useState<ViewName>(ViewName.Dashboard);
  
  // Data hooks
  const { personas, addPersona, updatePersona, deletePersona } = usePersonas();
  const { channels, messages, createChannel, deleteChannel, sendMessage } = useChat();

  const handleLogout = async () => {
    try {
      await signOut();
      showToast('Logged out successfully', 'info');
    } catch (error: any) {
      showToast(error.message || 'Error logging out', 'error');
    }
  };

  const handleAddPersona = async (personaData: any) => {
    try {
      await addPersona(personaData);
      showToast('Persona created successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create persona', 'error');
    }
  };

  const handleUpdatePersona = async (persona: any) => {
    try {
      await updatePersona(persona);
      showToast('Persona updated successfully!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to update persona', 'error');
    }
  };

  const handleAddCustomChannel = async (name: string) => {
    try {
      await createChannel(name);
      showToast(`Channel "${name}" created!`, 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to create channel', 'error');
    }
  };

  const handleRemoveCustomChannel = async (channelId: string) => {
    try {
      const channel = channels.find(c => c.id === channelId);
      await deleteChannel(channelId);
      showToast(`Channel "${channel?.name}" removed.`, 'info');
    } catch (error: any) {
      showToast(error.message || 'Failed to remove channel', 'error');
    }
  };

  const handleSendMessage = async (channelId: string, text?: string, attachment?: any) => {
    try {
      await sendMessage(channelId, text, attachment);
    } catch (error: any) {
      showToast(error.message || 'Failed to send message', 'error');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case ViewName.Dashboard:
        return (
          <DashboardView 
            campaignData={{
              personas,
              operators: [],
              contentDrafts: [],
              scheduledPosts: [],
              connectedAccounts: [],
              contentLibraryAssets: [],
              customChannels: channels.map(c => ({
                id: c.id,
                name: c.name,
                createdBy: c.created_by,
                createdAt: c.created_at,
              })),
              chatMessages: messages.map(m => ({
                id: m.id,
                channelId: m.channel_id,
                senderEmail: user.email || '',
                senderName: profile?.name || user.email?.split('@')[0] || 'Unknown',
                timestamp: m.timestamp,
                text: m.text_content || undefined,
                attachment: m.attachment_name ? {
                  name: m.attachment_name,
                  type: m.attachment_type || '',
                  size: m.attachment_size || 0,
                } : undefined,
              })),
            }}
            onNavigate={setCurrentView}
          />
        );
      
      case ViewName.AudienceModeling:
        return (
          <AudienceModelingView
            personas={personas}
            onAddPersona={handleAddPersona}
            onUpdatePersona={handleUpdatePersona}
          />
        );
      
      case ViewName.TeamChat:
        return (
          <ChatView
            currentUser={{
              id: user.id,
              email: user.email || '',
              name: profile?.name || undefined,
              passwordHash: '', // Not needed for Supabase version
              teamMembers: profile?.team_members || [],
            }}
            teamMembers={profile?.team_members || []}
            customChannels={channels.map(c => ({
              id: c.id,
              name: c.name,
              createdBy: c.created_by,
              createdAt: c.created_at,
            }))}
            chatMessages={messages.map(m => ({
              id: m.id,
              channelId: m.channel_id,
              senderEmail: user.email || '',
              senderName: profile?.name || user.email?.split('@')[0] || 'Unknown',
              timestamp: m.timestamp,
              text: m.text_content || undefined,
              attachment: m.attachment_name ? {
                name: m.attachment_name,
                type: m.attachment_type || '',
                size: m.attachment_size || 0,
              } : undefined,
            }))}
            onAddChatMessage={async (message) => {
              await handleSendMessage(message.channelId, message.text, message.attachment);
            }}
            onAddCustomChannel={handleAddCustomChannel}
            onRemoveCustomChannel={handleRemoveCustomChannel}
          />
        );
      
      case ViewName.FeedbackSimulator:
        return (
          <FeedbackSimulatorView
            personas={personas}
            operators={[]}
            contentDrafts={[]}
          />
        );
      
      case ViewName.AuditTool:
        return <AuditToolView />;
      
      case ViewName.Methodology:
        return <MethodologyView />;
      
      case ViewName.AdminPanel:
        return <AdminPanelView />;
      
      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">
              {currentView}
            </h2>
            <p className="text-textSecondary">
              This view is being migrated to Supabase. Check back soon!
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar 
        currentView={currentView} 
        onNavigate={setCurrentView} 
        onLogout={handleLogout}
        isAuthenticated={true}
      />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {renderView()}
      </main>
      
      <footer className="bg-gray-800 text-white text-center p-4 text-sm">
        &copy; {new Date().getFullYear()} {APP_TITLE}. Powered by Supabase. 
        Advanced AI for Strategic Social Engagement.
      </footer>
    </div>
  );
};