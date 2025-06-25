
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, ChatMessage, ChatMessageAttachment, CustomChannel } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { PaperAirplaneIcon, PaperClipIcon, UserCircleIcon, HashtagIcon, PlusIcon, TrashIcon } from './ui/Icons';
import { useToast } from './ui/ToastProvider';
import { ACCEPTED_CHAT_FILE_TYPES, CHAT_IMAGE_PREVIEW_MAX_SIZE_BYTES, GENERAL_CHAT_CHANNEL_ID, GENERAL_CHAT_CHANNEL_NAME } from '../constants';
import { format } from 'date-fns';

interface ChatViewProps {
  currentUser: User;
  teamMembers: string[];
  customChannels: CustomChannel[];
  chatMessages: ChatMessage[];
  onAddChatMessage: (message: ChatMessage) => void;
  onAddCustomChannel: (name: string) => void;
  onRemoveCustomChannel: (channelId: string) => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const ChatView: React.FC<ChatViewProps> = ({ 
    currentUser, teamMembers, customChannels, chatMessages, 
    onAddChatMessage, onAddCustomChannel, onRemoveCustomChannel 
}) => {
  const { showToast } = useToast();
  const [activeChannelId, setActiveChannelId] = useState<string>(GENERAL_CHAT_CHANNEL_ID);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddChannelInput, setShowAddChannelInput] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [chatMessages, activeChannelId]);
  
  // Reset new channel input when active channel changes or input is hidden
  useEffect(() => {
    if (!showAddChannelInput) {
        setNewChannelName('');
    }
  }, [showAddChannelInput, activeChannelId]);


  const getDmChannelId = (memberEmail: string): string => {
    const emails = [currentUser.email, memberEmail].sort();
    return `dm_${emails[0]}_${emails[1]}`;
  };
  
  const getChannelDisplayName = (channelId: string): string => {
    if (channelId === GENERAL_CHAT_CHANNEL_ID) return GENERAL_CHAT_CHANNEL_NAME;
    
    const customChannel = customChannels.find(c => c.id === channelId);
    if (customChannel) return customChannel.name;

    if (channelId.startsWith('dm_')) {
        const parts = channelId.split('_');
        const otherUserEmail = parts.find(part => part !== currentUser.email && part !== 'dm');
        const otherUserName = teamMembers.find(email => email === otherUserEmail)?.split('@')[0] || otherUserEmail || "Direct Message";
        return otherUserName;
    }
    return channelId; // Fallback
  };

  const currentChannelMessages = chatMessages.filter(msg => msg.channelId === activeChannelId)
                                         .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const handleSendMessage = (text: string, attachment?: ChatMessageAttachment) => {
    if (!text.trim() && !attachment) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      channelId: activeChannelId,
      senderEmail: currentUser.email,
      senderName: currentUser.name || currentUser.email.split('@')[0],
      timestamp: new Date().toISOString(),
      text: text.trim() || undefined,
      attachment: attachment,
    };
    onAddChatMessage(newMessage);
    setMessageInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  
  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_CHAT_FILE_TYPES.includes(file.type)) {
        showToast(`Unsupported file type: ${file.type}.`, 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) { 
        showToast(`File is too large (${formatBytes(file.size)}). Maximum size is 5MB.`, 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const attachmentInfo: ChatMessageAttachment = {
        name: file.name,
        type: file.type,
        size: file.size,
      };

      if (file.type.startsWith('image/') && file.size < CHAT_IMAGE_PREVIEW_MAX_SIZE_BYTES) {
        const reader = new FileReader();
        reader.onloadend = () => {
          attachmentInfo.dataUrl = reader.result as string;
          handleSendMessage(messageInput, attachmentInfo); 
        };
        reader.onerror = () => {
          showToast('Failed to read image for preview.', 'error');
          handleSendMessage(messageInput, { name: file.name, type: file.type, size: file.size });
        };
        reader.readAsDataURL(file);
      } else {
        handleSendMessage(messageInput, attachmentInfo);
      }
    }
  };

  const handleCreateChannel = () => {
    if (!newChannelName.trim()) {
      showToast("Channel name cannot be empty.", "error");
      return;
    }
    let channelName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');
    if (!channelName.startsWith('#')) {
        channelName = `#${channelName}`;
    }
    onAddCustomChannel(channelName);
    setNewChannelName('');
    setShowAddChannelInput(false);
  };

  const handleDeleteChannel = (channelId: string, channelName: string) => {
    if (window.confirm(`Are you sure you want to delete the channel "${channelName}"? This action cannot be undone.`)) {
        onRemoveCustomChannel(channelId);
        if (activeChannelId === channelId) { // If active channel is deleted, switch to general
            setActiveChannelId(GENERAL_CHAT_CHANNEL_ID);
        }
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] bg-card shadow-lg rounded-lg overflow-hidden">
      <header className="bg-primary text-white p-4 flex items-center justify-between shadow-md">
        <h2 className="text-xl font-semibold">{getChannelDisplayName(activeChannelId)}</h2>
        <span className="text-xs opacity-80">Team Chat</span>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 min-w-[220px] max-w-[300px] bg-gray-100 border-r border-lightBorder p-3 space-y-3 overflow-y-auto">
          <div>
            <div className="flex justify-between items-center mb-1">
                <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Channels</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddChannelInput(!showAddChannelInput)} className="p-1 text-textSecondary hover:text-primary" aria-label="Add new channel" title="Add new channel">
                    <PlusIcon className="w-4 h-4" />
                </Button>
            </div>
            {showAddChannelInput && (
              <div className="mb-2 p-2 bg-gray-200 rounded">
                <Input 
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  placeholder="New channel name..."
                  className="text-sm py-1"
                  containerClassName="mb-1"
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateChannel();}}
                />
                <Button size="sm" variant="primary" onClick={handleCreateChannel} className="w-full text-xs py-1">Create</Button>
              </div>
            )}
            <button
              onClick={() => setActiveChannelId(GENERAL_CHAT_CHANNEL_ID)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm flex items-center group
                ${activeChannelId === GENERAL_CHAT_CHANNEL_ID ? 'bg-blue-100 text-primary font-medium' : 'text-textPrimary hover:bg-gray-200'}`}
            >
              <HashtagIcon className="w-4 h-4 mr-1.5 text-gray-500"/> {GENERAL_CHAT_CHANNEL_NAME}
            </button>
            {customChannels.map(channel => (
              <div key={channel.id} className="flex items-center group">
                <button
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm flex items-center flex-grow
                    ${activeChannelId === channel.id ? 'bg-blue-100 text-primary font-medium' : 'text-textPrimary hover:bg-gray-200'}`}
                  title={channel.name}
                >
                  <HashtagIcon className="w-4 h-4 mr-1.5 text-gray-500"/> 
                  <span className="truncate">{channel.name}</span>
                </button>
                {/* Show delete button only if channel is custom and not #general */}
                {channel.id !== GENERAL_CHAT_CHANNEL_ID && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteChannel(channel.id, channel.name)} 
                        className="p-1 text-gray-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity ml-1" 
                        aria-label={`Delete channel ${channel.name}`}
                        title={`Delete channel ${channel.name}`}
                    >
                        <TrashIcon className="w-3.5 h-3.5"/>
                    </Button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wider mb-1">Direct Messages</h3>
            {teamMembers.length > 0 ? (
              teamMembers.map(memberEmail => {
                if(memberEmail === currentUser.email) return null;
                const dmId = getDmChannelId(memberEmail);
                return (
                  <button
                    key={memberEmail}
                    onClick={() => setActiveChannelId(dmId)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm flex items-center group
                      ${activeChannelId === dmId ? 'bg-blue-100 text-primary font-medium' : 'text-textPrimary hover:bg-gray-200'}`}
                  >
                    <UserCircleIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                    <span className="truncate">{memberEmail.split('@')[0]}</span>
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-textSecondary italic px-2.5">No team members available for DMs.</p>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-background">
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {currentChannelMessages.length === 0 && (
              <div className="text-center text-textSecondary py-10">
                No messages in {getChannelDisplayName(activeChannelId)} yet. Be the first!
              </div>
            )}
            {currentChannelMessages.map(msg => {
              const isCurrentUser = msg.senderEmail === currentUser.email;
              return (
                <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow ${
                      isCurrentUser ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 text-textPrimary rounded-bl-none'
                    }`}
                  >
                    {!isCurrentUser && (
                      <p className="text-xs font-semibold mb-0.5 opacity-80">{msg.senderName}</p>
                    )}
                    {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                    {msg.attachment && (
                      <div className={`mt-2 p-2 rounded-md ${isCurrentUser ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <div className="flex items-center space-x-2">
                          <PaperClipIcon className={`w-4 h-4 ${isCurrentUser ? 'text-blue-100' : 'text-gray-600'}`} />
                          <span className={`text-xs font-medium truncate ${isCurrentUser ? 'text-blue-50' : 'text-gray-700'}`} title={msg.attachment.name}>
                            {msg.attachment.name}
                          </span>
                        </div>
                        <p className={`text-xxs opacity-70 ${isCurrentUser ? 'text-blue-200' : 'text-gray-500'}`}>
                          {msg.attachment.type} - {formatBytes(msg.attachment.size)}
                        </p>
                        {msg.attachment.dataUrl && msg.attachment.type.startsWith('image/') && (
                           <img src={msg.attachment.dataUrl} alt="Preview" className="mt-1 max-w-[100px] max-h-20 rounded object-contain"/>
                        )}
                      </div>
                    )}
                    <p className={`text-xxs mt-1.5 ${isCurrentUser ? 'text-right opacity-70' : 'text-left opacity-60'}`}>
                      {format(new Date(msg.timestamp), 'p')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-gray-50 p-3 border-t border-lightBorder">
            <div className="flex items-center space-x-2">
              <input type="file" ref={fileInputRef} onChange={handleFileAttach} className="hidden" id="chat-file-input" accept={ACCEPTED_CHAT_FILE_TYPES.join(',')} />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
                className="p-2"
                title="Attach file"
              >
                <PaperClipIcon className="w-5 h-5 text-textSecondary hover:text-primary"/>
              </Button>
              <Textarea
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(messageInput);
                    }
                }}
                placeholder={`Message ${getChannelDisplayName(activeChannelId)}...`}
                className="flex-1 text-sm resize-none"
                rows={1}
                containerClassName="mb-0 flex-grow"
                aria-label={`Message input for ${getChannelDisplayName(activeChannelId)}`}
              />
              <Button 
                variant="primary" 
                size="sm" 
                onClick={() => handleSendMessage(messageInput)}
                disabled={!messageInput.trim() && !fileInputRef.current?.files?.length}
                aria-label="Send message"
                className="p-2"
              >
                <PaperAirplaneIcon className="w-5 h-5"/>
              </Button>
            </div>
             <p className="text-xxs text-gray-400 mt-1 ml-12">Shift+Enter for new line.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

const style = document.createElement('style');
style.innerHTML = `
  .text-xxs {
    font-size: 0.65rem; 
    line-height: 0.8rem;
  }
`;
document.head.appendChild(style);
