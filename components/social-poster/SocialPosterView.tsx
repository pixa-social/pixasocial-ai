
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    ScheduledPost, ViewName, UserProfile, ContentDraft, 
    ScheduledPostStatus, ConnectedAccount, Persona, Operator 
} from '../../types';
import { Card } from '../ui/Card';
import { Tabs, Tab } from '../ui/Tabs';
import { useToast } from '../ui/ToastProvider';
import { SocialPosterSkeleton } from './SocialPosterSkeleton';
import { PrerequisiteMessageCard } from '../ui/PrerequisiteMessageCard';
import { PostCard } from './PostCard';
import { useNavigateToView } from '../../hooks/useNavigateToView';
import { ClockIcon, CheckCircleIcon, ExclamationCircleIcon } from '../ui/Icons';

interface SocialPosterViewProps {
    currentUser: UserProfile;
    scheduledPosts: ScheduledPost[];
    contentDrafts: ContentDraft[];
    personas: Persona[];
    operators: Operator[];
    connectedAccounts: ConnectedAccount[];
    onUpdateScheduledPost: (post: ScheduledPost) => void;
    onDeleteScheduledPost: (postId: string) => void;
    onNavigate?: (view: ViewName) => void;
}

const SIMULATION_INTERVAL = 15000; // 15 seconds

export const SocialPosterView: React.FC<SocialPosterViewProps> = ({
    currentUser, scheduledPosts, contentDrafts, personas, operators, connectedAccounts,
    onUpdateScheduledPost, onDeleteScheduledPost, onNavigate
}) => {
    const { showToast } = useToast();
    const navigateTo = useNavigateToView(onNavigate);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

    const runPostingSimulation = useCallback(async (postsToProcess: ScheduledPost[]) => {
        for (const post of postsToProcess) {
            setIsProcessing(prev => ({ ...prev, [post.id]: true }));

            const publishingPost = { ...post, resource: { ...post.resource, status: 'Publishing' as ScheduledPostStatus, last_attempted_at: new Date().toISOString(), error_message: undefined } };
            onUpdateScheduledPost(publishingPost);

            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

            const isSuccess = Math.random() > 0.15; // 85% success rate
            let finalStatus: ScheduledPostStatus;
            let errorMessage: string | undefined = undefined;

            if (isSuccess) {
                finalStatus = 'Published';
                showToast(`Post for ${post.title.split(':')[0]} published successfully!`, 'success');
            } else {
                finalStatus = 'Failed';
                errorMessage = 'Simulated API error: The connection timed out.';
                showToast(`Failed to publish post for ${post.title.split(':')[0]}.`, 'error');
            }

            const finishedPost = { ...post, resource: { ...post.resource, status: finalStatus, error_message: errorMessage } };
            onUpdateScheduledPost(finishedPost);
            
            setIsProcessing(prev => {
                const newState = { ...prev };
                delete newState[post.id];
                return newState;
            });
        }
    }, [onUpdateScheduledPost, showToast]);

    useEffect(() => {
        const checkQueue = () => {
            if (connectedAccounts.length === 0) {
                return; // Don't run simulation if no accounts are connected
            }
            const now = new Date();
            const postsToPublish = scheduledPosts.filter(p => 
                p.resource.status === 'Scheduled' && 
                new Date(p.start) <= now &&
                !isProcessing[p.id]
            );
            if (postsToPublish.length > 0) {
                runPostingSimulation(postsToPublish);
            }
        };

        const intervalId = setInterval(checkQueue, SIMULATION_INTERVAL);
        checkQueue();
        return () => clearInterval(intervalId);
    }, [scheduledPosts, runPostingSimulation, isProcessing, connectedAccounts.length]);
    
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 750);
        return () => clearTimeout(timer);
    }, []);

    const handlePostNow = useCallback((postId: string) => {
        if (connectedAccounts.length === 0) {
            showToast("Cannot post now. Please connect a social account in Settings first.", "error");
            return;
        }
        const post = scheduledPosts.find(p => p.id === postId);
        if (post) {
            runPostingSimulation([post]);
        }
    }, [scheduledPosts, runPostingSimulation, connectedAccounts.length, showToast]);

    const navigateToCalendar = useCallback(() => {
        if(onNavigate) onNavigate(ViewName.Calendar);
    }, [onNavigate]);

    const categorizedPosts = useMemo(() => {
        const queue: ScheduledPost[] = [];
        const history: ScheduledPost[] = [];
        const errors: ScheduledPost[] = [];
        
        scheduledPosts.forEach(post => {
            switch(post.resource.status) {
                case 'Scheduled':
                case 'Publishing':
                    queue.push(post);
                    break;
                case 'Published':
                case 'Cancelled':
                    history.push(post);
                    break;
                case 'Failed':
                case 'Missed':
                    errors.push(post);
                    break;
            }
        });
        
        queue.sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        history.sort((a,b) => new Date(b.start).getTime() - new Date(a.start).getTime());
        errors.sort((a,b) => new Date(b.start).getTime() - new Date(a.start).getTime());

        return { queue, history, errors };
    }, [scheduledPosts]);

    if (isLoading) {
        return <SocialPosterSkeleton />;
    }
    
    return (
        <div className="p-4 md:p-6">
            <h2 className="text-3xl font-bold text-textPrimary mb-6">Social Poster</h2>

            {connectedAccounts.length === 0 && (
                <PrerequisiteMessageCard
                    title="Connect a Social Account to Enable Posting"
                    message="You can preview scheduled posts here, but the queue will not automatically publish them until at least one social account is connected. Please go to your settings to enable posting."
                    action={{ label: "Go to Settings", onClick: () => navigateTo(ViewName.Settings) }}
                />
            )}

            <Tabs>
                <Tab label={`Queue (${categorizedPosts.queue.length})`} icon={<ClockIcon className="w-5 h-5"/>}>
                    <div className="mt-4 space-y-4">
                        {categorizedPosts.queue.length === 0 ? (
                            <Card className="text-center p-8 text-textSecondary">
                                The queue is empty. Scheduled posts will appear here.
                            </Card>
                        ) : (
                            categorizedPosts.queue.map(post => {
                                const draft = contentDrafts.find(d => d.id === post.resource.contentDraftId)
                                return (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    draft={draft}
                                    persona={personas.find(p => p.id === draft?.persona_id)}
                                    operator={operators.find(o => o.id === draft?.operator_id)}
                                    onPostNow={handlePostNow}
                                    onDelete={onDeleteScheduledPost}
                                    onNavigateToCalendar={navigateToCalendar}
                                />
                            )})
                        )}
                    </div>
                </Tab>
                <Tab label={`History (${categorizedPosts.history.length})`} icon={<CheckCircleIcon className="w-5 h-5"/>}>
                     <div className="mt-4 space-y-4">
                        {categorizedPosts.history.length === 0 ? (
                            <Card className="text-center p-8 text-textSecondary">
                                No posts have been published or cancelled yet.
                            </Card>
                        ) : (
                            categorizedPosts.history.map(post => {
                                const draft = contentDrafts.find(d => d.id === post.resource.contentDraftId)
                                return (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    draft={draft}
                                    persona={personas.find(p => p.id === draft?.persona_id)}
                                    operator={operators.find(o => o.id === draft?.operator_id)}
                                    onPostNow={handlePostNow}
                                    onDelete={onDeleteScheduledPost}
                                    onNavigateToCalendar={navigateToCalendar}
                                />
                            )})
                        )}
                    </div>
                </Tab>
                <Tab label={`Errors (${categorizedPosts.errors.length})`} icon={<ExclamationCircleIcon className="w-5 h-5"/>}>
                     <div className="mt-4 space-y-4">
                        {categorizedPosts.errors.length === 0 ? (
                            <Card className="text-center p-8 text-textSecondary">
                                No posts have failed.
                            </Card>
                        ) : (
                            categorizedPosts.errors.map(post => {
                                const draft = contentDrafts.find(d => d.id === post.resource.contentDraftId)
                                return (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    draft={draft}
                                    persona={personas.find(p => p.id === draft?.persona_id)}
                                    operator={operators.find(o => o.id === draft?.operator_id)}
                                    onPostNow={handlePostNow}
                                    onDelete={onDeleteScheduledPost}
                                    onNavigateToCalendar={navigateToCalendar}
                                />
                            )})
                        )}
                    </div>
                </Tab>
            </Tabs>
        </div>
    );
};
