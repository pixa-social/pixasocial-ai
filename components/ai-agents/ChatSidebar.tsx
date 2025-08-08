import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ChatSession, Persona, AdminPersona } from '../../types';
import { Button } from '../ui/Button';
import { PlusIcon, TrashIcon, DownloadIcon } from '../ui/Icons';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Avatar } from '../ui/Avatar';

// --- PROPS ---

interface ChatSidebarProps {
  sessions: ChatSession[];
  personas: Persona[];
  adminPersonas: AdminPersona[];
  activeSessionId: string | null;
  isLoading: boolean;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
  onImportAdminPersona: (persona: AdminPersona) => void;
}

// --- SUB-COMPONENTS ---

const SidebarHeader: React.FC<{ onNewChat: () => void }> = ({ onNewChat }) => (
  <div className="px-1 pb-2">
    <Button
      onClick={onNewChat}
      variant="primary"
      className="w-full bg-primary/70 backdrop-blur-sm border border-primary/30 shadow-lg hover:bg-primary/80"
      leftIcon={<PlusIcon className="w-4 h-4" />}
    >
      New Chat
    </Button>
  </div>
);

const SessionItem: React.FC<{
  session: ChatSession;
  persona: Persona | undefined;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}> = ({ session, persona, isActive, onSelect, onDelete }) => (
  <button
    onClick={onSelect}
    className={`w-full group text-left flex justify-between items-center p-2.5 rounded-lg text-sm transition-colors ${
      isActive ? 'bg-primary/20 text-foreground' : 'text-muted-foreground hover:bg-card hover:text-foreground'
    }`}
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
      onClick={onDelete}
      aria-label="Delete session"
    >
      <TrashIcon className="w-4 h-4" />
    </Button>
  </button>
);

const ChatHistoryList: React.FC<{
  isLoading: boolean;
  sessions: ChatSession[];
  personas: Persona[];
  activeSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
}> = ({ isLoading, sessions, personas, activeSessionId, onSelectSession, onDeleteSession }) => (
  <div>
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2.5 mb-1">My Chat History</h3>
    {isLoading ? <LoadingSpinner size="sm" className="mt-8" /> : sessions.map(session => {
      const persona = personas.find(p => p.id === session.persona_id);
      return (
        <SessionItem
          key={session.id}
          session={session}
          persona={persona}
          isActive={activeSessionId === session.id}
          onSelect={() => onSelectSession(session)}
          onDelete={(e) => onDeleteSession(e, session.id)}
        />
      );
    })}
  </div>
);

const TemplateAgentItem: React.FC<{
  persona: AdminPersona;
  onImport: () => void;
}> = ({ persona, onImport }) => (
  <button
    onClick={onImport}
    className="w-full group text-left flex justify-between items-center p-2.5 rounded-lg text-sm text-muted-foreground hover:bg-card hover:text-foreground transition-colors"
  >
    <div className="flex items-center gap-3 flex-1 truncate">
        <Avatar name={persona?.name || '?'} imageUrl={persona?.avatar_url} size="sm" />
        <p className="font-medium truncate">{persona.name}</p>
    </div>
    <DownloadIcon className="w-4 h-4 text-muted-foreground mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
  </button>
);

const TemplateAgentsList: React.FC<{
  adminPersonas: AdminPersona[];
  onImportAdminPersona: (persona: AdminPersona) => void;
}> = ({ adminPersonas, onImportAdminPersona }) => (
  <div>
    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2.5 mb-1">Template Agents</h3>
    {adminPersonas.map(persona => (
      <TemplateAgentItem
        key={`admin-${persona.id}`}
        persona={persona}
        onImport={() => onImportAdminPersona(persona)}
      />
    ))}
  </div>
);

// --- MAIN COMPONENT ---

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sessions,
  personas,
  adminPersonas,
  activeSessionId,
  isLoading,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onImportAdminPersona,
}) => (
  <aside className="w-1/4 min-w-[260px] max-w-[320px] bg-background/50 border-r border-border flex flex-col p-3">
    <SidebarHeader onNewChat={onNewChat} />
    <div className="flex-grow overflow-y-auto space-y-4 pr-1">
      <ChatHistoryList
        isLoading={isLoading}
        sessions={sessions}
        personas={personas}
        activeSessionId={activeSessionId}
        onSelectSession={onSelectSession}
        onDeleteSession={onDeleteSession}
      />
      <TemplateAgentsList
        adminPersonas={adminPersonas}
        onImportAdminPersona={onImportAdminPersona}
      />
    </div>
  </aside>
);