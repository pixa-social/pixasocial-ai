
import React, { useState, useCallback } from 'react';
import { User, CustomChannel } from '../../types';
import { GENERAL_CHAT_CHANNEL_ID, GENERAL_CHAT_CHANNEL_NAME } from '../../constants';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { HashtagIcon, PlusIcon, UserCircleIcon, TrashIcon } from '../ui/Icons';

interface ChatSidebarProps {
  currentUser: User;
  teamMembers: string[];
  customChannels: CustomChannel[];
  onAddCustomChannel: (name: string) => void;
  onRemoveCustomChannel: (channelId: string) => void;
  activeChannelId: string;
  setActiveChannelId: (channelId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  currentUser,
  teamMembers,
  customChannels,
  onAddCustomChannel,
  onRemoveCustomChannel,
  activeChannelId,
  setActiveChannelId,
}) => {
  const [showAddChannelInput, setShowAddChannelInput] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const getDmChannelId = useCallback((memberEmail: string): string => {
    const emails = [currentUser.email, memberEmail].filter((e): e is string => !!e).sort();
    return `dm_${emails[0]}_${emails[1]}`;
  }, [currentUser.email]);

  const handleCreateChannel = useCallback(() => {
    if (!newChannelName.trim()) return;
    let channelName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!channelName.startsWith('#')) {
      channelName = `#${channelName}`;
    }
    onAddCustomChannel(channelName);
    setNewChannelName('');
    setShowAddChannelInput(false);
  }, [newChannelName, onAddCustomChannel]);

  const handleDeleteChannel = useCallback((e: React.MouseEvent, channelId: string, channelName: string) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the channel "${channelName}"?`)) {
      onRemoveCustomChannel(channelId);
      if (activeChannelId === channelId) {
        setActiveChannelId(GENERAL_CHAT_CHANNEL_ID);
      }
    }
  }, [onRemoveCustomChannel, activeChannelId, setActiveChannelId]);

  return (
    <aside className="w-1/4 min-w-[240px] max-w-[320px] bg-background border-r border-lightBorder p-3 flex flex-col">
      <div className="flex-grow overflow-y-auto space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1 px-2">
            <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider">Channels</h3>
            <Button variant="ghost" size="icon" onClick={() => setShowAddChannelInput(!showAddChannelInput)} className="h-7 w-7" aria-label="Add new channel" title="Add new channel">
              <PlusIcon className="w-4 h-4 text-textSecondary" />
            </Button>
          </div>
          {showAddChannelInput && (
            <div className="my-2 p-2 bg-card rounded-md">
              <Input
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                placeholder="# new-channel"
                className="text-sm py-1"
                containerClassName="mb-1"
                onKeyDown={e => { if (e.key === 'Enter') handleCreateChannel(); }}
              />
              <Button size="sm" variant="primary" onClick={handleCreateChannel} className="w-full text-xs py-1">Create</Button>
            </div>
          )}
          <ul className="space-y-1">
            <ChannelItem
              name={GENERAL_CHAT_CHANNEL_NAME}
              isActive={activeChannelId === GENERAL_CHAT_CHANNEL_ID}
              onClick={() => setActiveChannelId(GENERAL_CHAT_CHANNEL_ID)}
            />
            {customChannels.map(channel => (
              <ChannelItem
                key={channel.id}
                name={channel.name}
                isActive={activeChannelId === channel.id}
                onClick={() => setActiveChannelId(channel.id)}
                onDelete={(e) => handleDeleteChannel(e, channel.id, channel.name)}
              />
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-1 px-2">Direct Messages</h3>
          <ul className="space-y-1">
            {teamMembers.length > 0 ? (
              teamMembers.map(memberEmail => {
                if (memberEmail === currentUser.email) return null;
                const dmId = getDmChannelId(memberEmail);
                return (
                  <DMItem
                    key={memberEmail}
                    name={memberEmail.split('@')[0]}
                    isActive={activeChannelId === dmId}
                    onClick={() => setActiveChannelId(dmId)}
                  />
                );
              })
            ) : (
              <li className="text-xs text-textSecondary italic px-2 py-1">No team members available.</li>
            )}
          </ul>
        </div>
      </div>
    </aside>
  );
};

// Sub-component for a channel list item
const ChannelItem: React.FC<{ name: string; isActive: boolean; onClick: () => void; onDelete?: (e: React.MouseEvent) => void }> = ({ name, isActive, onClick, onDelete }) => (
  <li
    onClick={onClick}
    className={`w-full flex justify-between items-center px-2 py-1.5 rounded-md text-sm cursor-pointer group transition-colors
      ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-textSecondary hover:bg-card'}`}
  >
    <span className="flex items-center truncate">
      <HashtagIcon className="w-4 h-4 mr-2" />
      <span className="truncate">{name}</span>
    </span>
    {onDelete && (
      <Button variant="ghost" size="icon" onClick={onDelete} className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-danger/20 hover:text-danger" title={`Delete channel ${name}`}>
        <TrashIcon className="w-3.5 h-3.5" />
      </Button>
    )}
  </li>
);

// Sub-component for a DM list item
const DMItem: React.FC<{ name: string; isActive: boolean; onClick: () => void }> = ({ name, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`w-full flex items-center px-2 py-1.5 rounded-md text-sm cursor-pointer group transition-colors
      ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-textSecondary hover:bg-card'}`}
  >
    <UserCircleIcon className="w-4 h-4 mr-2" />
    <span className="truncate">{name}</span>
  </li>
);
