
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Gun from 'gun/gun'; 
import 'gun/lib/radix'; 
import 'gun/lib/radisk'; 
import 'gun/lib/store'; 
import 'gun/lib/rindexed'; 

import { User, ChatMessage, ChatMessageAttachment, CustomChannel } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { PaperAirplaneIcon, PaperClipIcon, UserCircleIcon, HashtagIcon, PlusIcon, TrashIcon } from './ui/Icons';
import { useToast } from './ui/ToastProvider';
import { ACCEPTED_CHAT_FILE_TYPES, CHAT_IMAGE_PREVIEW_MAX_SIZE_BYTES, GENERAL_CHAT_CHANNEL_ID, GENERAL_CHAT_CHANNEL_NAME } from '../constants';
import { format } from 'date-fns';
import { ChatMessageItem } from './chat/ChatMessageItem'; 

interface ChatViewProps {
  currentUser: User;
  teamMembers: string[];
  customChannels: CustomChannel[];
  onAddCustomChannel: (name: string) => void;
  onRemoveCustomChannel: (channelId: string) => void;
}

const gun = Gun({ 
  peers: ['https://gun-manhattan.herokuapp.com/gun'], 
  localStorage: false, 
  radisk: true, 
  rindexed: 'PixaSocialChat'
});


const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const ChatView: React.FC<ChatViewProps> = ({ 
    currentUser, teamMembers, customChannels, 
    onAddCustomChannel, onRemoveCustomChannel 
}) => {
  const { showToast } = useToast();
  const [activeChannelId, setActiveChannelId] = useState<string>(GENERAL_CHAT_CHANNEL_ID);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddChannelInput, setShowAddChannelInput] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [currentChannelMessages, setCurrentChannelMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const gunMessagesRef = useRef<any>(null); 

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  },[]);

  useEffect(scrollToBottom, [currentChannelMessages, scrollToBottom]);
  
  useEffect(() => {
    if (!showAddChannelInput) {
        setNewChannelName('');
    }
  }, [showAddChannelInput, activeChannelId]);

  useEffect(() => {
    setCurrentChannelMessages([]); 
    setIsLoadingMessages(true);

    if (gunMessagesRef.current) {
      gunMessagesRef.current.off(); 
    }

    const channelMessagesPath = gun.get('pixasocial/chat/messages').get(activeChannelId);
    gunMessagesRef.current = channelMessagesPath; 

    const loadedMsgs: Record<string, ChatMessage> = {};
    let initialLoadComplete = false;
    let loadTimeout: ReturnType<typeof setTimeout>;

    channelMessagesPath.map().on((data: ChatMessage | null, id: string) => {
      if (data) {
        if (typeof data === 'object' && data !== null && data.id && data.created_at) {
          loadedMsgs[id] = { ...data, created_at: new Date(data.created_at).toISOString() }; 
          
          if(initialLoadComplete) { 
             setCurrentChannelMessages(prevMsgs => {
                const existingMsgIndex = prevMsgs.findIndex(m => m.id === data.id);
                if (existingMsgIndex > -1) {
                    const updated = [...prevMsgs];
                    updated[existingMsgIndex] = data;
                    return updated.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                }
                return [...prevMsgs, data].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
             });
          }
        }
      } else if (data === null && loadedMsgs[id]) { 
        delete loadedMsgs[id];
        if(initialLoadComplete) {
            setCurrentChannelMessages(Object.values(loadedMsgs).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
        }
      }
    });

    loadTimeout = setTimeout(() => {
        initialLoadComplete = true;
        setCurrentChannelMessages(Object.values(loadedMsgs).sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
        setIsLoadingMessages(false);
    }, 750); 


    return () => {
      if (gunMessagesRef.current) {
        gunMessagesRef.current.off();
      }
      clearTimeout(loadTimeout);
    };
  }, [activeChannelId]);


  const getDmChannelId = useCallback((memberEmail: string): string => {
    const emails = [currentUser.email, memberEmail].filter((e): e is string => !!e).sort();
    return `dm_${emails[0]}_${emails[1]}`;
  }, [currentUser.email]);
  
  const getChannelDisplayName = useCallback((channelId: string): string => {
    if (channelId === GENERAL_CHAT_CHANNEL_ID) return GENERAL_CHAT_CHANNEL_NAME;
    
    const customChannel = customChannels.find(c => c.id === channelId);
    if (customChannel) return customChannel.name;

    if (channelId.startsWith('dm_')) {
        const parts = channelId.split('_');
        const otherUserEmail = parts.find(part => part !== currentUser.email && part !== 'dm');
        const otherUserName = teamMembers.find(email => email === otherUserEmail)?.split('@')[0];
        return otherUserName || otherUserEmail || "Direct Message";
    }
    return channelId; 
  }, [customChannels, currentUser.email, teamMembers]);


  const handleSendMessage = useCallback((text: string, attachment?: ChatMessageAttachment) => {
    if ((!text || !text.trim()) && !attachment) return;
    if (!currentUser.email) return;

    const newMessageData: ChatMessage = { 
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      channel_id: activeChannelId,
      user_id: currentUser.id,
      sender_name: currentUser.name || currentUser.email.split('@')[0],
      created_at: new Date().toISOString(),
      text: text ? text.trim() : undefined,
      attachment: attachment ? attachment : undefined
    };
    
    gun.get('pixasocial/chat/messages').get(activeChannelId).get(newMessageData.id).put(newMessageData, (ack) => {
        if ((ack as any).err) { 
            showToast(`Error sending message: ${(ack as any).err}`, 'error');
            console.error('GunDB send error:', (ack as any).err);
        }
    });

    setMessageInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [activeChannelId, currentUser, showToast]);
  
  const handleFileAttach = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
        publicUrl: '', // Will be populated for images
      };

      if (file.type.startsWith('image/') && file.size < CHAT_IMAGE_PREVIEW_MAX_SIZE_BYTES) {
        const reader = new FileReader();
        reader.onloadend = () => {
          attachmentInfo.publicUrl = reader.result as string;
          handleSendMessage(messageInput, attachmentInfo); 
        };
        reader.onerror = () => {
          showToast('Failed to read image for preview.', 'error');
          handleSendMessage(messageInput, attachmentInfo);
        };
        reader.readAsDataURL(file);
      } else {
        handleSendMessage(messageInput, attachmentInfo);
      }
    }
  }, [showToast, handleSendMessage, messageInput]);

  const handleCreateChannel = useCallback(() => {
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
  }, [newChannelName, onAddCustomChannel, showToast]);

  const handleDeleteChannel = useCallback((channelId: string, channelName: string) => {
    if (window.confirm(`Are you sure you want to delete the channel "${channelName}"? This action cannot be undone.`)) {
        onRemoveCustomChannel(channelId);
        if (activeChannelId === channelId) { 
            setActiveChannelId(GENERAL_CHAT_CHANNEL_ID);
        }
    }
  }, [onRemoveCustomChannel, activeChannelId]);


  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] bg-card shadow-lg rounded-lg overflow-hidden">
      <header className="bg-primary text-white p-4 flex items-center justify-between shadow-md">
        <h2 className="text-xl font-semibold">{getChannelDisplayName(activeChannelId)}</h2>
        <span className="text-xs opacity-80">Team Chat (Decentralized with GunDB)</span>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-1/4 min-w-[220px] max-w-[300px] bg-gray-50 border-r border-lightBorder p-3 space-y-3 overflow-y-auto"> 
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
            {isLoadingMessages && <div className="text-center text-textSecondary py-10">Loading messages...</div>}
            {!isLoadingMessages && currentChannelMessages.length === 0 && (
              <div className="text-center text-textSecondary py-10">
                No messages in {getChannelDisplayName(activeChannelId)} yet. Be the first!
              </div>
            )}
            {currentChannelMessages.map(msg => (
              <ChatMessageItem key={msg.id} msg={msg} currentUser={currentUser} />
            ))}
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
                disabled={!messageInput.trim() && (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0)}
                aria-label="Send message"
                className="p-2"
                title="Send message"
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

if (!document.getElementById('pixasocial-text-xxs-style')) {
  const style = document.createElement('style');
  style.id = 'pixasocial-text-xxs-style';
  style.innerHTML = `
    .text-xxs {
      font-size: 0.65rem; 
      line-height: 0.8rem;
    }
  `;
  document.head.appendChild(style);
}
