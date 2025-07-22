import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChatSession, Persona } from '../../types';
import { Button } from '../ui/Button';
import { PlusIcon, TrashIcon } from '../ui/Icons';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Avatar } from '../ui/Avatar';

interface ChatSidebarProps {
  sessions: ChatSession[];
  personas: Persona[];
  activeSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  personas,
  activeSessionId,
  isLoading,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}) => (
  <aside className="w-1/4 min-w-[260px] max-w-[320px] bg-background/50 border-r border-border flex flex-col p-3">
    <div className="px-1 pb-2">
        <Button onClick={onNewChat} variant="primary" className="w-full" leftIcon={<PlusIcon className="w-4 h-4" />}>New Chat</Button>
    </div>
    <div className="flex-grow overflow-y-auto space-y-1 pr-1">
      {isLoading ? <LoadingSpinner size="sm" className="mt-8"/> : sessions.map(session => {
        const persona = personas.find(p => p.id === session.persona_id);
        return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={`w-full group text-left flex justify-between items-center p-2.5 rounded-lg text-sm transition-colors ${activeSessionId === session.id ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:bg-card hover:text-foreground'}`}
            >
              <div className="flex items-center gap-3 flex-1 truncate">
                  <Avatar name={persona?.name || '?'} imageUrl={persona?.avatar_url} size="sm" />
                  <div className="flex-1 truncate">
                    <p className="font-medium truncate">{session.title}</p>
                    <p className="text-xs">{formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}</p>
                  </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                onClick={(e) => onDeleteSession(e, session.id)}
                aria-label="Delete session"
              >
                <TrashIcon className="w-4 h-4"/>
              </Button>
            </button>
        );
      })}
    </div>
  </aside>
);