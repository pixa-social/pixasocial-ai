import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { ViewName } from '../types';
import { format } from 'date-fns';
import { DashboardSkeleton } from './skeletons/DashboardSkeleton';
import { 
    UsersIcon, BeakerIcon, DocumentTextIcon, CalendarDaysIcon, LinkIcon, 
    ArrowRightIcon, PlusCircleIcon, ExclamationTriangleIcon
} from './ui/Icons'; 
import { useAppDataContext } from './MainAppLayout';
import { useNavigate } from 'react-router-dom';
import { VIEW_PATH_MAP } from '../constants';

export const DashboardView: React.FC = () => {
  const { 
    currentUser,
    personas,
    operators,
    contentDrafts,
    scheduledPosts,
    connectedAccounts,
    onNavigate,
  } = useAppDataContext();
  const navigate = useNavigate();

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
    { title: "Audience Personas", value: personas?.length ?? 0, icon: <UsersIcon className="w-8 h-8 text-primary" />, view: ViewName.AudienceModeling },
    { title: "Campaign Operators", value: operators?.length ?? 0, icon: <BeakerIcon className="w-8 h-8 text-accent" />, view: ViewName.OperatorBuilder },
    { title: "Content Drafts", value: contentDrafts?.length ?? 0, icon: <DocumentTextIcon className="w-8 h-8 text-yellow-500" />, view: ViewName.ContentPlanner },
    { title: "Upcoming Posts", value: upcomingPosts.length, icon: <CalendarDaysIcon className="w-8 h-8 text-blue-500" />, view: ViewName.Calendar },
    { title: "Connected Accounts", value: connectedAccounts?.length ?? 0, icon: <LinkIcon className="w-8 h-8 text-green-500" />, view: ViewName.Settings },
  ];

  const scheduledDraftIds = new Set((scheduledPosts ?? []).map(sp => sp.resource.contentDraftId));
  const draftsNotScheduledCount = (contentDrafts ?? []).filter(d => !scheduledDraftIds.has(d.id)).length;

  const operatorTargetAudienceIds = new Set((operators ?? []).map(op => op.target_audience_id));
  const personasWithoutOperatorsCount = (personas ?? []).filter(p => !operatorTargetAudienceIds.has(p.id)).length;
  
  const needsAttentionItems = [
    { 
      label: "Drafts Not Scheduled", 
      count: draftsNotScheduledCount, 
      view: ViewName.ContentPlanner, 
      icon: <DocumentTextIcon className="w-5 h-5 text-yellow-500" /> 
    },
    { 
      label: "Personas Without Operators", 
      count: personasWithoutOperatorsCount, 
      view: ViewName.OperatorBuilder, 
      icon: <UsersIcon className="w-5 h-5 text-primary" /> 
    },
  ].filter(item => item.count > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };
  
  if (!currentUser) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.h2 
        className="text-3xl font-bold text-foreground"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Dashboard Overview
      </motion.h2>
      
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {summaryMetrics.map(metric => (
          <motion.div 
            key={metric.title}
            variants={itemVariants}
            onClick={() => onNavigate(metric.view)}
            className="cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 hover:ring-2 hover:ring-primary/50 rounded-xl"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter') onNavigate(metric.view); }}
            aria-label={`View ${metric.title}`}
          >
            <Card className="text-center p-4 h-full flex flex-col justify-center items-center">
              <div className="flex justify-center mb-2">{metric.icon}</div>
              <p className="text-3xl font-bold text-foreground">{metric.value}</p>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {needsAttentionItems.length > 0 && (
        <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.6 }}>
          <Card title="Needs Attention" icon={<ExclamationTriangleIcon className="w-5 h-5 text-yellow-400"/>}>
              <div className="space-y-3">
              {needsAttentionItems.map(item => (
                  <div 
                      key={item.label}
                      onClick={() => item.count > 0 && onNavigate(item.view)}
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${item.count > 0 ? 'cursor-pointer hover:bg-white/5' : 'opacity-70'}`}
                      role={item.count > 0 ? "button" : undefined}
                      tabIndex={item.count > 0 ? 0 : -1}
                      onKeyPress={(e) => { if (e.key === 'Enter' && item.count > 0) onNavigate(item.view); }}
                      aria-label={`${item.label}: ${item.count} items. Click to view.`}
                  >
                  <div className="flex items-center">
                      {item.icon}
                      <p className="ml-3 text-sm font-medium text-foreground">{item.label}</p>
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-400/20 text-yellow-300">
                      {item.count}
                  </span>
                  </div>
              ))}
              </div>
          </Card>
        </motion.div>
      )}

      <motion.div variants={itemVariants} initial="hidden" animate="show" transition={{ delay: 0.7 }}>
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
      </motion.div>

      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.8 }}
      >
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card title="Upcoming Scheduled Posts">
            {upcomingPosts.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {upcomingPosts.map(post => {
                    const persona = (personas ?? []).find(p => p.id === post.resource.personaId);
                    
                    return (
                      <div key={post.id} className="p-3 bg-white/5 rounded-lg border border-border hover:shadow-lg transition-shadow">
                          <div className="flex justify-between items-start">
                              <div>
                                  <h4 className="font-semibold text-foreground text-sm">{post.title}</h4>
                                  <p className="text-xs text-muted-foreground">
                                  To: {persona?.name || 'N/A'}
                                  </p>
                              </div>
                              <span className="text-xs font-medium text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                                  {format(post.start, 'MMM d, h:mm a')}
                              </span>
                          </div>
                      </div>
                    );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No upcoming posts scheduled.</p>
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
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card title="Recent Activity">
            <div className="space-y-4">
              {latestPersona && ( <div className="p-3 bg-white/5 rounded-lg"><p className="text-xs text-muted-foreground mb-0.5">Latest Persona Added:</p><h5 className="font-semibold text-sm text-primary">{latestPersona.name}</h5><p className="text-xs text-muted-foreground truncate">{latestPersona.demographics}</p></div> )}
              {latestOperator && ( <div className="p-3 bg-white/5 rounded-lg"><p className="text-xs text-muted-foreground mb-0.5">Latest Operator Added:</p><h5 className="font-semibold text-sm text-accent">{latestOperator.name} ({latestOperator.type})</h5><p className="text-xs text-muted-foreground truncate">For: {(personas ?? []).find(p=>p.id === latestOperator.target_audience_id)?.name || 'N/A'}</p></div> )}
              {latestDraft && ( <div className="p-3 bg-white/5 rounded-lg"><p className="text-xs text-muted-foreground mb-0.5">Latest Content Draft Added:</p><h5 className="font-semibold text-sm text-yellow-500">Draft for {(personas ?? []).find(p => p.id === latestDraft.persona_id)?.name || 'N/A'}</h5><p className="text-xs text-muted-foreground truncate">Using Op: {(operators ?? []).find(o => o.id === latestDraft.operator_id)?.name || 'N/A'}</p></div> )}
              {!latestPersona && !latestOperator && !latestDraft && ( <p className="text-muted-foreground text-center py-4">No recent activity to display.</p> )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};