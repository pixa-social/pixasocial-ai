
import React from 'react';
import { Navbar } from './Navbar';
import { ViewName, User, UserProfile } from '../types';
import { APP_TITLE } from '../constants';
import { Breadcrumbs } from './ui/Breadcrumbs';

import { DashboardView } from './DashboardView';
import { AudienceModelingView } from './AudienceModelingView';
import { AnalyticsView } from './AnalyticsView';
import { OperatorBuilderView } from './OperatorBuilderView';
import { ContentPlannerView } from './ContentPlannerView';
import { CalendarView } from './CalendarView'; 
import { FeedbackSimulatorView } from './FeedbackSimulatorView';
import { AuditToolView } from './AuditToolView';
import { AdminPanelView } from './AdminPanelView';
import { SettingsView } from './SettingsView';
import { ContentLibraryView } from './ContentLibraryView';
import { ChatView } from './ChatView';
import { SocialPosterView } from './social-poster/SocialPosterView';
import { useAppData } from '../hooks/useAppData';

interface MainAppLayoutProps {
  currentView: ViewName;
  currentUser: UserProfile; 
  onNavigate: (view: ViewName) => void;
  onLogout: () => void;
  onUpdateUser: (updatedUserData: Partial<User>) => void;
}

export const MainAppLayout: React.FC<MainAppLayoutProps> = ({
  currentView,
  currentUser, 
  onNavigate,
  onLogout,
  onUpdateUser,
}) => {
  const { 
    personas, operators, contentDrafts, scheduledPosts, 
    contentLibraryAssets, customChannels, connectedAccounts, 
    handlers, fetchers 
  } = useAppData(currentUser);

  const renderView = () => {
    switch (currentView) {
      case ViewName.Dashboard:
        return <DashboardView 
                    currentUser={currentUser} 
                    onNavigate={onNavigate} 
                    connectedAccounts={connectedAccounts} 
                />;
      case ViewName.AudienceModeling:
        return <AudienceModelingView
                  currentUser={currentUser}
                  personas={personas}
                  onAddPersona={handlers.addPersona}
                  onUpdatePersona={handlers.updatePersona}
                  onDeletePersona={handlers.deletePersona}
                  onNavigate={onNavigate}
                />;
      case ViewName.Analytics:
        return <AnalyticsView 
                    currentUser={currentUser} 
                    personas={personas} 
                    onNavigate={onNavigate} 
                />;
      case ViewName.OperatorBuilder:
        return <OperatorBuilderView
                  currentUser={currentUser}
                  personas={personas}
                  operators={operators}
                  onAddOperator={handlers.addOperator}
                  onUpdateOperator={handlers.updateOperator}
                  onDeleteOperator={handlers.deleteOperator}
                  onNavigate={onNavigate}
                />;
      case ViewName.ContentPlanner:
        return <ContentPlannerView 
                  currentUser={currentUser}
                  contentDrafts={contentDrafts}
                  personas={personas}
                  operators={operators}
                  onAddContentDraft={handlers.addContentDraft}
                  onDeleteContentDraft={handlers.deleteContentDraft}
                  onDeletePlatformContent={handlers.deletePlatformContent}
                  onAddScheduledPost={handlers.addScheduledPost}
                  onAddContentLibraryAsset={handlers.addAsset}
                  onNavigate={onNavigate} 
                />;
      case ViewName.Calendar:
        return <CalendarView 
                  scheduledPosts={scheduledPosts}
                  contentDrafts={contentDrafts}
                  personas={personas}
                  operators={operators}
                  onUpdateScheduledPost={handlers.updateScheduledPost}
                  onDeleteScheduledPost={handlers.deleteScheduledPost}
                  onNavigate={onNavigate} 
                />;
       case ViewName.ContentLibrary:
        return <ContentLibraryView 
                  assets={contentLibraryAssets}
                  onAddAsset={handlers.addAsset}
                  onUpdateAsset={handlers.updateAsset}
                  onRemoveAsset={handlers.removeAsset}
                />;
      case ViewName.FeedbackSimulator:
        return <FeedbackSimulatorView 
                  currentUser={currentUser}
                  personas={personas}
                  operators={operators}
                  contentDrafts={contentDrafts}
                  onNavigate={onNavigate} 
                />;
      case ViewName.AuditTool:
        return <AuditToolView currentUser={currentUser} />;
      case ViewName.SocialPoster:
        return <SocialPosterView
                  currentUser={currentUser}
                  scheduledPosts={scheduledPosts}
                  contentDrafts={contentDrafts}
                  personas={personas}
                  operators={operators}
                  connectedAccounts={connectedAccounts}
                  onAddScheduledPost={handlers.addScheduledPost}
                  onUpdateScheduledPost={handlers.updateScheduledPost}
                  onDeleteScheduledPost={handlers.deleteScheduledPost}
                  onNavigate={onNavigate}
                />;
      case ViewName.AdminPanel:
        return <AdminPanelView />;
      case ViewName.Settings: 
        return <SettingsView 
                  currentUser={currentUser} onUpdateUser={onUpdateUser}
                  connectedAccounts={connectedAccounts}
                  onAddConnectedAccount={handlers.addConnectedAccount}
                  onDeleteConnectedAccount={handlers.deleteConnectedAccount}
                  onAccountConnectOrDelete={fetchers.fetchConnectedAccounts}
                />;
      case ViewName.TeamChat:
        return <ChatView
                  currentUser={currentUser}
                  teamMembers={currentUser.teamMembers || []}
                  customChannels={customChannels}
                  onAddCustomChannel={handlers.addCustomChannel}
                  onRemoveCustomChannel={handlers.removeCustomChannel}
                />;
      default:
        return <DashboardView 
                    currentUser={currentUser} 
                    onNavigate={onNavigate} 
                    connectedAccounts={connectedAccounts} 
                />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar currentView={currentView} onNavigate={onNavigate} onLogout={onLogout} isAuthenticated={!!currentUser} currentUser={currentUser} />
      <Breadcrumbs currentView={currentView} onNavigate={onNavigate} />
      <main className="flex-grow container mx-auto px-4 pb-8 max-w-7xl">
        {renderView()}
      </main>
      <footer className="bg-gray-900 text-gray-400 text-center p-4 text-sm border-t border-border">
        &copy; {new Date().getFullYear()} {APP_TITLE}. All rights reserved.
      </footer>
    </div>
  );
};
