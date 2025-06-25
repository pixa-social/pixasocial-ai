
import React from 'react';
import { Navbar } from './Navbar';
import { ViewName, CampaignData, ConnectedAccount, ContentLibraryAsset, User, ChatMessage, CustomChannel } from '../types';
import { APP_TITLE } from '../constants';

import { DashboardView } from './DashboardView';
import { AudienceModelingView } from './AudienceModelingView';
import { OperatorBuilderView } from './OperatorBuilderView';
import { ContentPlannerView } from './ContentPlannerView';
import { CalendarView } from './CalendarView'; 
import { FeedbackSimulatorView } from './FeedbackSimulatorView';
import { AuditToolView } from './AuditToolView';
import { MethodologyView } from './MethodologyView';
import { AdminPanelView } from './AdminPanelView';
import { SettingsView } from './SettingsView';
import { ContentLibraryView } from './ContentLibraryView';
import { ChatView } from './ChatView';

interface MainAppLayoutProps {
  currentView: ViewName;
  currentUser: User; 
  campaignData: CampaignData;
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onUpdateUser: (updatedUserData: Partial<User>) => void; 
  handleAddPersona: (persona: CampaignData['personas'][0]) => void;
  handleUpdatePersona: (persona: CampaignData['personas'][0]) => void;
  handleAddOperator: (operator: CampaignData['operators'][0]) => void;
  handleUpdateOperator: (operator: CampaignData['operators'][0]) => void;
  handleAddContentDraft: (draft: CampaignData['contentDrafts'][0]) => void;
  handleAddScheduledPost: (post: CampaignData['scheduledPosts'][0]) => void;
  handleUpdateScheduledPost: (post: CampaignData['scheduledPosts'][0]) => void;
  handleDeleteScheduledPost: (postId: string) => void;
  handleAddConnectedAccount: (account: ConnectedAccount) => void;
  handleRemoveConnectedAccount: (platform: ConnectedAccount['platform']) => void;
  handleAddContentLibraryAsset: (asset: ContentLibraryAsset) => void;
  handleRemoveContentLibraryAsset: (assetId: string) => void;
  handleAddChatMessage: (message: ChatMessage) => void;
  handleAddCustomChannel: (name: string) => void; // New prop
  handleRemoveCustomChannel: (channelId: string) => void; // New prop
}

export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  currentView,
  currentUser, 
  campaignData,
  onNavigate,
  onLogout,
  onUpdateUser, 
  handleAddPersona,
  handleUpdatePersona,
  handleAddOperator,
  handleUpdateOperator,
  handleAddContentDraft,
  handleAddScheduledPost,
  handleUpdateScheduledPost,
  handleDeleteScheduledPost,
  handleAddConnectedAccount,
  handleRemoveConnectedAccount,
  handleAddContentLibraryAsset,
  handleRemoveContentLibraryAsset,
  handleAddChatMessage,
  handleAddCustomChannel, // Destructure new prop
  handleRemoveCustomChannel, // Destructure new prop
}) => {
  const renderView = () => {
    switch (currentView) {
      case ViewName.Dashboard:
        return <DashboardView campaignData={campaignData} onNavigate={onNavigate} />;
      case ViewName.AudienceModeling:
        return <AudienceModelingView personas={campaignData.personas} onAddPersona={handleAddPersona} onUpdatePersona={handleUpdatePersona} />;
      case ViewName.OperatorBuilder:
        return <OperatorBuilderView operators={campaignData.operators} personas={campaignData.personas} onAddOperator={handleAddOperator} onUpdateOperator={handleUpdateOperator} />;
      case ViewName.ContentPlanner:
        return <ContentPlannerView 
                  contentDrafts={campaignData.contentDrafts} 
                  personas={campaignData.personas} 
                  operators={campaignData.operators} 
                  onAddContentDraft={handleAddContentDraft}
                  onAddScheduledPost={handleAddScheduledPost}
                  onAddContentLibraryAsset={handleAddContentLibraryAsset} 
                />;
      case ViewName.Calendar:
        return <CalendarView 
                  scheduledPosts={campaignData.scheduledPosts}
                  contentDrafts={campaignData.contentDrafts}
                  personas={campaignData.personas}
                  operators={campaignData.operators}
                  onUpdateScheduledPost={handleUpdateScheduledPost}
                  onDeleteScheduledPost={handleDeleteScheduledPost}
                />;
       case ViewName.ContentLibrary:
        return <ContentLibraryView 
                  assets={campaignData.contentLibraryAssets}
                  onAddAsset={handleAddContentLibraryAsset}
                  onRemoveAsset={handleRemoveContentLibraryAsset}
                />;
      case ViewName.FeedbackSimulator:
        return <FeedbackSimulatorView personas={campaignData.personas} operators={campaignData.operators} contentDrafts={campaignData.contentDrafts} />;
      case ViewName.AuditTool:
        return <AuditToolView />;
      case ViewName.Methodology:
        return <MethodologyView />;
      case ViewName.AdminPanel:
        return <AdminPanelView />;
      case ViewName.Settings: 
        return <SettingsView 
                  currentUser={currentUser} 
                  onUpdateUser={onUpdateUser} 
                  connectedAccounts={campaignData.connectedAccounts} 
                  onAddConnectedAccount={handleAddConnectedAccount} 
                  onRemoveConnectedAccount={handleRemoveConnectedAccount} 
                />;
      case ViewName.TeamChat:
        return <ChatView
                  currentUser={currentUser}
                  teamMembers={currentUser.teamMembers || []}
                  chatMessages={campaignData.chatMessages}
                  customChannels={campaignData.customChannels} // Pass custom channels
                  onAddChatMessage={handleAddChatMessage}
                  onAddCustomChannel={handleAddCustomChannel} // Pass handler
                  onRemoveCustomChannel={handleRemoveCustomChannel} // Pass handler
                />;
      default:
        return <DashboardView campaignData={campaignData} onNavigate={onNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentView={currentView} onNavigate={onNavigate} onLogout={onLogout} isAuthenticated={true} />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl">
        {renderView()}
      </main>
      <footer className="bg-gray-800 text-white text-center p-4 text-sm">
        &copy; {new Date().getFullYear()} {APP_TITLE}. For planning and educational purposes. AI features subject to provider terms. Data stored locally.
      </footer>
    </div>
  );
};
