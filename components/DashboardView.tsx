
import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { CampaignData, ViewName, ScheduledPost } from '../types';
import { format } from 'date-fns';
import { LoadingSpinner } from './ui/LoadingSpinner'; // If needed for async data in future
import { 
    UsersIcon, BeakerIcon, DocumentTextIcon, CalendarDaysIcon, LinkIcon, // Generic Icons
    ArrowRightIcon, PlusCircleIcon
} from './ui/Icons'; // Assuming you have or will add these

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
  const { personas, operators, contentDrafts, scheduledPosts, connectedAccounts } = campaignData;

  const upcomingPosts = scheduledPosts
    .filter(post => new Date(post.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5); // Show next 5

  const latestPersona = personas.length > 0 ? personas[personas.length - 1] : null;
  const latestOperator = operators.length > 0 ? operators[operators.length - 1] : null;
  const latestDraft = contentDrafts.length > 0 ? contentDrafts[contentDrafts.length - 1] : null;

  const quickActionButtons = [
    { label: "Create Persona", view: ViewName.AudienceModeling, icon: <PlusCircleIcon className="w-5 h-5 mr-2" /> },
    { label: "Design Operator", view: ViewName.OperatorBuilder, icon: <PlusCircleIcon className="w-5 h-5 mr-2" /> },
    { label: "Plan Content", view: ViewName.ContentPlanner, icon: <PlusCircleIcon className="w-5 h-5 mr-2" /> },
    { label: "View Calendar", view: ViewName.Calendar, icon: <CalendarDaysIcon className="w-5 h-5 mr-2" /> },
    { label: "Manage Settings", view: ViewName.Settings, icon: <LinkIcon className="w-5 h-5 mr-2" /> }, // Placeholder for CogIcon
  ];
  
  const summaryMetrics = [
    { title: "Audience Personas", value: personas.length, icon: <UsersIcon className="w-8 h-8 text-primary" /> },
    { title: "Campaign Operators", value: operators.length, icon: <BeakerIcon className="w-8 h-8 text-accent" /> },
    { title: "Content Drafts", value: contentDrafts.length, icon: <DocumentTextIcon className="w-8 h-8 text-yellow-500" /> },
    { title: "Upcoming Posts", value: upcomingPosts.length, icon: <CalendarDaysIcon className="w-8 h-8 text-blue-500" /> },
    { title: "Connected Accounts", value: connectedAccounts.length, icon: <LinkIcon className="w-8 h-8 text-green-500" /> },
  ];


  return (
    <div className="p-4 md:p-6 space-y-6">
      <h2 className="text-3xl font-bold text-textPrimary">Dashboard Overview</h2>
      
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {summaryMetrics.map(metric => (
          <Card key={metric.title} className="text-center p-4" shadow="soft-md">
            <div className="flex justify-center mb-2">{metric.icon}</div>
            <p className="text-3xl font-bold text-textPrimary">{metric.value}</p>
            <p className="text-sm text-textSecondary">{metric.title}</p>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
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
        {/* Upcoming Scheduled Posts */}
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

        {/* Recent Activity */}
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
