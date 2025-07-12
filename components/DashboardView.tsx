

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { User, ViewName, ScheduledPost, ContentDraft, Persona, Operator, ScheduledPostDbRow, ConnectedAccount } from '../types';
import { format } from 'date-fns';
import { DashboardSkeleton } from './skeletons/DashboardSkeleton';
import { 
    UsersIcon, BeakerIcon, DocumentTextIcon, CalendarDaysIcon, LinkIcon, 
    ArrowRightIcon, PlusCircleIcon, ExclamationTriangleIcon
} from './ui/Icons'; 
import { CONTENT_PLATFORMS } from '../constants';
import { supabase } from '../services/supabaseClient';

const getContentPreview = (content: string, length: number = 50): string => {
  if (!content) return "No content";
  return content.length > length ? content.substring(0, length) + "..." : content;
};

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (view: ViewName) => void;
  connectedAccounts: ConnectedAccount[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ currentUser, onNavigate, connectedAccounts }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [contentDrafts, setContentDrafts] = useState<ContentDraft[]>([]);
  const [scheduledPostRows, setScheduledPostRows] = useState<ScheduledPostDbRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: personaData } = await supabase.from('personas').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
      const { data: operatorData } = await supabase.from('operators').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
      const { data: draftData } = await supabase.from('content_drafts').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
      const { data: scheduleData } = await supabase.from('scheduled_posts').select('*').eq('user_id', currentUser.id).order('scheduled_at', { ascending: true });
      
      setPersonas((personaData as Persona[]) || []);
      setOperators(operatorData || []);
      setContentDrafts(draftData || []);
      setScheduledPostRows(scheduleData || []);
      setIsLoading(false);
    };

    if (currentUser?.id) {
        fetchData();
    }
  }, [currentUser.id]);

  const scheduledPosts: ScheduledPost[] = useMemo(() => (scheduledPostRows || []).map((p: ScheduledPostDbRow) => {
    const draft = contentDrafts.find(d => d.id === p.content_draft_id);
    const platformInfo = CONTENT_PLATFORMS.find(plat => plat.key === p.platform_key);
    let titleContent = "Untitled";
    if (draft) {
      const platformDetail = draft.platform_contents[p.platform_key];
      titleContent = platformDetail?.subject || platformDetail?.content?.substring(0, 20) || draft.key_message?.substring(0,20) || 'Content Draft';
    }
    const title = `${typeof platformInfo?.icon === 'string' ? platformInfo.icon : ''} ${platformInfo?.label || p.platform_key}: ${titleContent}...`;
    const startDate = new Date(p.scheduled_at);
    return {
      id: `sch_${p.id}_${p.platform_key}`,
      db_id: p.id,
      title: title,
      start: startDate,
      end: new Date(startDate.getTime() + 60 * 60 * 1000),
      allDay: false,
      resource: {
        contentDraftId: p.content_draft_id,
        platformKey: p.platform_key,
        status: p.status,
        notes: p.notes,
        personaId: draft?.persona_id || 0,
        operatorId: draft?.operator_id || 0,
      }
    };
  }), [scheduledPostRows, contentDrafts]);

  const now = useMemo(() => new Date(), []);
  const upcomingPosts = useMemo(() => (scheduledPosts ?? [])
    .filter(post => post.start >= now)
    .slice(0, 5), [scheduledPosts, now]);

  const latestPersona = (personas?.length ?? 0) > 0 ? personas[0] : null;
  const latestOperator = (operators?.length ?? 0) > 0 ? operators[0] : null;
  const latestDraft = (contentDrafts?.length ?? 0) > 0 ? contentDrafts.sort((a,b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())[0] : null;

  const quickActionButtons = [
    { label: "Create Persona", view: ViewName.AudienceModeling, icon: <PlusCircleIcon className="w-5 h-5 mr-2" /> },
    { label: "Design Operator", view: ViewName.OperatorBuilder, icon: <PlusCircleIcon className="w-5 h-5 mr-2" /> },
    { label: "Plan Content", view: ViewName.ContentPlanner, icon: <PlusCircleIcon className="w-5 h-5 mr-2" /> },
    { label: "View Calendar", view: ViewName.Calendar, icon: <CalendarDaysIcon className="w-5 h-5 mr-2" /> },
    { label: "Manage Settings", view: ViewName.Settings, icon: <LinkIcon className="w-5 h-5 mr-2" /> },
  ];
  
  const summaryMetrics = [
    { title: "Audience Personas", value: personas?.length ?? 0, icon: <UsersIcon className="w-8 h-8 text-primary" />, navigateTo: ViewName.AudienceModeling },
    { title: "Campaign Operators", value: operators?.length ?? 0, icon: <BeakerIcon className="w-8 h-8 text-accent" />, navigateTo: ViewName.OperatorBuilder },
    { title: "Content Drafts", value: contentDrafts?.length ?? 0, icon: <DocumentTextIcon className="w-8 h-8 text-yellow-500" />, navigateTo: ViewName.ContentPlanner },
    { title: "Upcoming Posts", value: upcomingPosts.length, icon: <CalendarDaysIcon className="w-8 h-8 text-blue-500" />, navigateTo: ViewName.Calendar },
    { title: "Connected Accounts", value: connectedAccounts?.length ?? 0, icon: <LinkIcon className="w-8 h-8 text-green-500" />, navigateTo: ViewName.Settings },
  ];

  const scheduledDraftIds = new Set((scheduledPosts ?? []).map(sp => sp.resource.contentDraftId));
  const draftsNotScheduledCount = (contentDrafts ?? []).filter(d => !scheduledDraftIds.has(d.id)).length;

  const operatorTargetAudienceIds = new Set((operators ?? []).map(op => op.target_audience_id));
  const personasWithoutOperatorsCount = (personas ?? []).filter(p => !operatorTargetAudienceIds.has(p.id)).length;
  
  const needsAttentionItems = [
    { 
      label: "Drafts Not Scheduled", 
      count: draftsNotScheduledCount, 
      navigateTo: ViewName.ContentPlanner, 
      icon: <DocumentTextIcon className="w-5 h-5 text-yellow-500" /> 
    },
    { 
      label: "Personas Without Operators", 
      count: personasWithoutOperatorsCount, 
      navigateTo: ViewName.OperatorBuilder, 
      icon: <UsersIcon className="w-5 h-5 text-primary" /> 
    },
  ].filter(item => item.count > 0);

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
            className="cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onNavigate(metric.navigateTo); }}
            aria-label={`View ${metric.title}`}
          >
            <Card className="text-center p-4 h-full flex flex-col justify-center items-center">
              <div className="flex justify-center mb-2">{metric.icon}</div>
              <p className="text-3xl font-bold text-textPrimary">{metric.value}</p>
              <p className="text-sm text-textSecondary">{metric.title}</p>
            </Card>
          </div>
        ))}
      </div>

      {needsAttentionItems.length > 0 && (
        <Card title="Needs Attention" icon={<ExclamationTriangleIcon className="w-5 h-5 text-yellow-400"/>}>
            <div className="space-y-3">
            {needsAttentionItems.map(item => (
                <div 
                    key={item.label}
                    onClick={() => item.count > 0 && onNavigate(item.navigateTo)}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${item.count > 0 ? 'cursor-pointer hover:bg-white/5' : 'opacity-70'}`}
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

      <Card title="Quick Actions">
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
        <Card title="Upcoming Scheduled Posts" className="lg:col-span-2">
          {upcomingPosts.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {upcomingPosts.map(post => {
                  const draft = (contentDrafts ?? []).find(d => d.id === post.resource.contentDraftId);
                  const platformInfo = draft?.platform_contents[post.resource.platformKey];
                  const persona = (personas ?? []).find(p => p.id === post.resource.personaId);
                  
                  return (
                    <div key={post.id} className="p-3 bg-white/5 rounded-lg border border-lightBorder hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-textPrimary text-sm">{post.title}</h4>
                                <p className="text-xs text-textSecondary">
                                To: {persona?.name || 'N/A'}
                                </p>
                            </div>
                            <span className="text-xs font-medium text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                                {format(post.start, 'MMM d, h:mm a')}
                            </span>
                        </div>
                        {platformInfo?.content && (
                            <p className="text-xs text-textSecondary mt-1 truncate">
                                {getContentPreview(platformInfo.subject || platformInfo.content, 60)}
                            </p>
                        )}
                         <p className="text-xs text-textSecondary mt-1 capitalize">Status: <span className={`font-medium ${post.resource.status === 'Scheduled' ? 'text-primary' : 'text-textSecondary'}`}>{post.resource.status}</span></p>
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

        <Card title="Recent Activity">
          <div className="space-y-4">
            {latestPersona && (
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-textSecondary mb-0.5">Latest Persona Added:</p>
                <h5 className="font-semibold text-sm text-primary">{latestPersona.name}</h5>
                <p className="text-xs text-textSecondary truncate">{latestPersona.demographics}</p>
              </div>
            )}
            {latestOperator && (
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-textSecondary mb-0.5">Latest Operator Added:</p>
                <h5 className="font-semibold text-sm text-accent">{latestOperator.name} ({latestOperator.type})</h5>
                 <p className="text-xs text-textSecondary truncate">For: {(personas ?? []).find(p=>p.id === latestOperator.target_audience_id)?.name || 'N/A'}</p>
              </div>
            )}
            {latestDraft && (
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-xs text-textSecondary mb-0.5">Latest Content Draft Added:</p>
                <h5 className="font-semibold text-sm text-yellow-500">
                    Draft for {(personas ?? []).find(p => p.id === latestDraft.persona_id)?.name || 'N/A'}
                </h5>
                <p className="text-xs text-textSecondary truncate">Using Op: {(operators ?? []).find(o => o.id === latestDraft.operator_id)?.name || 'N/A'}</p>
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