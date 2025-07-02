import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CampaignData, ViewName, ScheduledPost, SocialPlatformType, ContentDraft } from '../types';
import { format } from 'date-fns';
import { DashboardSkeleton } from './skeletons/DashboardSkeleton';
import { 
    UsersIcon, BeakerIcon, DocumentTextIcon, CalendarDaysIcon, LinkIcon, 
    ArrowRightIcon, PlusCircleIcon, ExclamationTriangleIcon
} from './ui/Icons'; 
import { CONTENT_PLATFORMS } from '../constants';
import { fetchDashboardData, subscribeToDashboardData, DashboardData } from '../services/dashboardService';

// Helper function to get a limited preview of content
const getContentPreview = (content: string, length: number = 50): string => {
  if (!content) return "No content";
  return content.length > length ? content.substring(0, length) + "..." : content;
};

interface DashboardViewProps {
  campaignData: CampaignData;
  onNavigate: (view: ViewName) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ campaignData, onNavigate }) => {
  const [isLoading, setIsLoading] = useState(true); 
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchDashboardData();
        if (data) {
          setDashboardData(data);
        } else {
          console.warn('No dashboard data found for user.');
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setIsLoading(false);
      }
    };

    loadDashboardData();

    let subscription: { unsubscribe: () => void } | null = null;
    // Subscribe to real-time updates
    subscribeToDashboardData((updatedData) => {
      setDashboardData(updatedData);
    }).then(sub => {
      subscription = sub;
      console.log('Subscribed to dashboard data updates.');
    }).catch(err => {
      console.error('Failed to subscribe to dashboard data:', err);
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log('Unsubscribed from dashboard data updates.');
      }
    };
  }, []);

  const { personas, operators, contentDrafts, scheduledPosts, connectedAccounts } = campaignData;

  const upcomingPosts = scheduledPosts
    .filter(post => new Date(post.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

  const latestPersona = personas.length > 0 ? personas[personas.length - 1] : null;
  const latestOperator = operators.length > 0 ? operators[operators.length - 1] : null;
  const latestDraft = contentDrafts.length > 0 ? contentDrafts[contentDrafts.length - 1] : null;

  const quickActionButtons = [
    { label: "Create Persona", view: ViewName.AudienceModeling, icon: <PlusCircleIcon className="w-5 h-5 mr-2" /> },
    { label: "Design Operator", view: ViewName.OperatorBuilder, icon: <PlusCircleIcon className="w-5 h-5 mr-2" /> },
    { label: "Plan Content", view: ViewName.ContentPlanner, icon: <PlusCircleIcon className="w-5 h-5 mr-2" /> },
    { label: "View Calendar", view: ViewName.Calendar, icon: <CalendarDaysIcon className="w-5 h-5 mr-2" /> },
    { label: "Manage Settings", view: ViewName.Settings, icon: <LinkIcon className="w-5 h-5 mr-2" /> },
  ];
  
  const summaryMetrics = [
    { title: "Audience Personas", value: dashboardData?.personas_count ?? 0, icon: <UsersIcon className="w-8 h-8 text-primary" />, navigateTo: ViewName.AudienceModeling },
    { title: "Campaign Operators", value: dashboardData?.operators_count ?? 0, icon: <BeakerIcon className="w-8 h-8 text-accent" />, navigateTo: ViewName.OperatorBuilder },
    { title: "Content Drafts", value: dashboardData?.content_drafts_count ?? 0, icon: <DocumentTextIcon className="w-8 h-8 text-yellow-500" />, navigateTo: ViewName.ContentPlanner },
    { title: "Upcoming Posts", value: dashboardData?.upcoming_posts_count ?? 0, icon: <CalendarDaysIcon className="w-8 h-8 text-blue-500" />, navigateTo: ViewName.Calendar },
    { title: "Connected Accounts", value: dashboardData?.connected_accounts_count ?? 0, icon: <LinkIcon className="w-8 h-8 text-green-500" />, navigateTo: ViewName.Settings },
  ];

  // "Needs Attention" calculations
  const scheduledDraftIds = new Set(scheduledPosts.map(sp => sp.resource.contentDraftId));
  const draftsNotScheduledCount = contentDrafts.filter(d => !scheduledDraftIds.has(d.id)).length;

  const operatorTargetAudienceIds = new Set(operators.map(op => op.targetAudienceId));
  const personasWithoutOperatorsCount = personas.filter(p => !operatorTargetAudienceIds.has(p.id)).length;
  
  const connectedPlatformTypes = new Set(connectedAccounts.map(acc => acc.platform as string));
  const postsForDisconnectedPlatformsCount = scheduledPosts.filter(post => {
    const platformConfig = CONTENT_PLATFORMS.find(p => p.key === post.resource.platformKey);
    // Consider a platform "social" if it's not an Email or a Poster type
    const isSocialPlatform = platformConfig && !platformConfig.isPoster && platformConfig.key !== 'Email';
    if (isSocialPlatform) {
      // The platformKey from CONTENT_PLATFORMS (e.g., "X") should directly match SocialPlatformType enum values
      return !connectedPlatformTypes.has(post.resource.platformKey as SocialPlatformType);
    }
    return false;
  }).length;

  const needsAttentionItems = [
    { 
      label: "Drafts Not Scheduled", 
      count: draftsNotScheduledCount, 
      navigateTo: ViewName.ContentPlanner, 
      icon: <DocumentTextIcon className="w-5 h-5 text-yellow-600" /> 
    },
    { 
      label: "Personas Without Operators", 
      count: personasWithoutOperatorsCount, 
      navigateTo: ViewName.OperatorBuilder, 
      icon: <UsersIcon className="w-5 h-5 text-blue-600" /> 
    },
    { 
      label: "Posts for Disconnected Platforms", 
      count: postsForDisconnectedPlatformsCount, 
      navigateTo: ViewName.Settings, 
      icon: <LinkIcon className="w-5 h-5 text-red-600" /> 
    },
  ].filter(item => item.count > 0); // Only show items that need attention

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-3xl font-bold text-textPrimary">Dashboard Overview</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {summaryMetrics.map(metric => (
          <div 
            key={metric.title} 
            onClick={() => onNavigate(metric.navigateTo)}
            className="cursor-pointer transition-all duration-150 ease-in-out hover:shadow-md hover:-translate-y-1"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onNavigate(metric.navigateTo); }}
            aria-label={`View ${metric.title}`}
          >
            <Card className="text-center p-4 h-full flex flex-col justify-center items-center" shadow="soft-md">
              <div className="flex justify-center mb-2">{metric.icon}</div>
              <p className="text-3xl font-bold text-textPrimary">{metric.value}</p>
              <p className="text-sm text-textSecondary">{metric.title}</p>
            </Card>
          </div>
        ))}
      </div>

      {/* Needs Attention Section */}
      {needsAttentionItems.length > 0 && (
        <Card title="Needs Attention" shadow="soft-md" className="border-l-4 border-warning bg-yellow-50">
            <div className="space-y-3">
            {needsAttentionItems.map(item => (
                <div 
                    key={item.label}
                    onClick={() => item.count > 0 && onNavigate(item.navigateTo)}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${item.count > 0 ? 'cursor-pointer hover:bg-yellow-100' : 'opacity-70'}`}
                    role={item.count > 0 ? "button" : undefined}
                    tabIndex={item.count > 0 ? 0 : -1}
                    onKeyPress={(e) => { if (e.key === 'Enter' && item.count > 0) onNavigate(item.navigateTo); }}
                    aria-label={`${item.label}: ${item.count} items. Click to view.`}
                >
                <div className="flex items-center">
                    {item.icon}
                    <p className="ml-3 text-sm font-medium text-textPrimary">{item.label}</p>
                </div>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-warning text-yellow-800">
                    {item.count}
                </span>
                </div>
            ))}
            </div>
        </Card>
      )}

      <Card title="Quick Actions" shadow="soft-md">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {quickActionButtons.map(action => (
            <Button 
              key={action.label} 
              variant="secondary" 
              onClick={() => onNavigate(action.view)}
              className="w-full justify-start text-left"
              leftIcon={action.icon}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Upcoming Scheduled Posts" className="lg:col-span-2" shadow="soft-md">
          {upcomingPosts.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {upcomingPosts.map(post => {
                  const draft = contentDrafts.find(d => d.id === post.resource.contentDraftId);
                  const platformInfo = draft?.platformContents[post.resource.platformKey];
                  const persona = personas.find(p => p.id === post.resource.personaId);
                  
                  return (
                    <div key={post.id} className="p-3 bg-gray-50 rounded-lg border border-lightBorder hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-textPrimary text-sm">{post.title}</h4>
                                <p className="text-xs text-textSecondary">
                                To: {persona?.name || 'N/A'}
                                </p>
                            </div>
                            <span className="text-xs font-medium text-primary bg-blue-100 px-2 py-0.5 rounded-full">
                                {format(new Date(post.start), 'MMM d, h:mm a')}
                            </span>
                        </div>
                        {platformInfo?.content && (
                            <p className="text-xs text-textSecondary mt-1 truncate">
                                {getContentPreview(platformInfo.subject || platformInfo.content, 60)}
                            </p>
                        )}
                         <p className="text-xs text-textSecondary mt-1 capitalize">Status: <span className={`font-medium ${post.resource.status === 'Scheduled' ? 'text-blue-600' : 'text-gray-600'}`}>{post.resource.status}</span></p>
                    </div>
                  );
              })}
            </div>
          ) : (
            <p className="text-textSecondary text-center py-4">No upcoming posts scheduled.</p>
          )}
          <Button 
            variant="ghost" 
            onClick={() => onNavigate(ViewName.Calendar)} 
            className="mt-4 w-full"
            rightIcon={<ArrowRightIcon className="w-4 h-4" />}
            >
            View Full Calendar
          </Button>
        </Card>

        <Card title="Recent Activity" shadow="soft-md">
          <div className="space-y-4">
            {latestPersona && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-textSecondary mb-0.5">Latest Persona Added:</p>
                <h5 className="font-semibold text-sm text-primary">{latestPersona.name}</h5>
                <p className="text-xs text-textSecondary truncate">{latestPersona.demographics}</p>
              </div>
            )}
            {latestOperator && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-textSecondary mb-0.5">Latest Operator Added:</p>
                <h5 className="font-semibold text-sm text-accent">{latestOperator.name} ({latestOperator.type})</h5>
                 <p className="text-xs text-textSecondary truncate">For: {personas.find(p=>p.id === latestOperator.targetAudienceId)?.name || 'N/A'}</p>
              </div>
            )}
            {latestDraft && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-textSecondary mb-0.5">Latest Content Draft Added:</p>
                <h5 className="font-semibold text-sm text-yellow-600">
                    Draft for {personas.find(p => p.id === latestDraft.personaId)?.name || 'N/A'}
                </h5>
                <p className="text-xs text-textSecondary truncate">Using Op: {operators.find(o => o.id === latestDraft.operatorId)?.name || 'N/A'}</p>
              </div>
            )}
            {!latestPersona && !latestOperator && !latestDraft && (
              <p className="text-textSecondary text-center py-4">No recent activity to display.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
