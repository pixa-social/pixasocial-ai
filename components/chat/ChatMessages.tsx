
import React, { useRef, useEffect, useMemo } from 'react';
import { ChatMessage, User, CustomChannel } from '../../types';
import { ChatMessageItem } from './ChatMessageItem';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ChatMessagesProps {
  currentUser: User;
  messages: ChatMessage[];
  isLoading: boolean;
  activeChannelId: string;
  customChannels: CustomChannel[];
  teamMembers: string[];
  editingMessageId: string | null;
  editingText: string;
  setEditingText: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditMessage: (msg: ChatMessage) => void;
  onDeleteMessage: (messageId: string) => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  currentUser,
  messages,
  isLoading,
  activeChannelId,
  customChannels,
  teamMembers,
  editingMessageId,
  editingText,
  setEditingText,
  onSaveEdit,
  onCancelEdit,
  onEditMessage,
  onDeleteMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getChannelDisplayName = (channelId: string): string => {
    const customChannel = customChannels.find(c => c.id === channelId);
    if (customChannel) return customChannel.name;

    if (channelId.startsWith('dm_')) {
      const parts = channelId.split('_');
      const otherUserEmail = parts.find(part => part !== currentUser.email && part !== 'dm');
      return otherUserEmail?.split('@')[0] || "Direct Message";
    }
    return "#general";
  };

  const messageGroups = useMemo(() => {
    const groups: ChatMessage[][] = [];
    if (messages.length === 0) return groups;

    let currentGroup: ChatMessage[] = [messages[0]];
    for (let i = 1; i < messages.length; i++) {
      const prevMsg = messages[i - 1];
      const currentMsg = messages[i];
      const timeDiff = new Date(currentMsg.created_at).getTime() - new Date(prevMsg.created_at).getTime();

      if (currentMsg.user_id === prevMsg.user_id && timeDiff < 5 * 60 * 1000) {
        currentGroup.push(currentMsg);
      } else {
        groups.push(currentGroup);
        currentGroup = [currentMsg];
      }
    }
    groups.push(currentGroup);
    return groups;
  }, [messages]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card text-white p-4 border-b border-lightBorder shadow-sm z-10">
            <h2 className="text-lg font-semibold text-textPrimary">{getChannelDisplayName(activeChannelId)}</h2>
            <p className="text-xs text-textSecondary">A decentralized chat for your team.</p>
        </header>

        <div className="flex-1 p-4 space-y-1 overflow-y-auto">
            {isLoading && <LoadingSpinner text="Loading messages..." />}
            {!isLoading && messages.length === 0 && (
                <div className="text-center text-textSecondary py-10">
                    No messages in {getChannelDisplayName(activeChannelId)} yet. Be the first!
                </div>
            )}
            
            {messageGroups.map((group, groupIndex) => (
                <div key={`${group[0]?.id}-group`}>
                    {group.map((msg, msgIndex) => (
                        <ChatMessageItem
                            key={msg.id}
                            msg={msg}
                            currentUser={currentUser}
                            isFirstInGroup={msgIndex === 0}
                            onEdit={onEditMessage}
                            onDelete={onDeleteMessage}
                            isEditing={editingMessageId === msg.id}
                            editingText={editingText}
                            setEditingText={setEditingText}
                            onSaveEdit={onSaveEdit}
                            onCancelEdit={onCancelEdit}
                        />
                    ))}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    </div>
  );
};
