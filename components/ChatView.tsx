

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Gun from 'gun/gun'; 
import 'gun/lib/radix'; 
import 'gun/lib/radisk'; 
import 'gun/lib/store'; 
import 'gun/lib/rindexed'; 

import { User, ChatMessage, ChatMessageAttachment, CustomChannel } from '../types';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { PaperAirplaneIcon, PaperClipIcon } from './ui/Icons';
import { useToast } from './ui/ToastProvider';
import { ACCEPTED_CHAT_FILE_TYPES, CHAT_IMAGE_PREVIEW_MAX_SIZE_BYTES, GENERAL_CHAT_CHANNEL_ID } from '../constants';
import { ChatSidebar } from './chat/ChatSidebar';
import { ChatMessages } from './chat/ChatMessages';

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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentChannelMessages, setCurrentChannelMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const gunMessagesRef = useRef<any>(null); 

  useEffect(() => {
    setCurrentChannelMessages([]); 
    setIsLoadingMessages(true);

    if (gunMessagesRef.current) gunMessagesRef.current.off();

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
             setCurrentChannelMessages(prev => {
                const existingIndex = prev.findIndex(m => m.id === data.id);
                if (existingIndex > -1) {
                    const updated = [...prev];
                    updated[existingIndex] = data;
                    return updated.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                }
                return [...prev, data].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
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
    }, 1000); 

    return () => {
      if (gunMessagesRef.current) gunMessagesRef.current.off();
      clearTimeout(loadTimeout);
    };
  }, [activeChannelId]);

  const sendMessage = useCallback((text: string, attachment?: ChatMessageAttachment) => {
    if ((!text || !text.trim()) && !attachment) return;
    if (!currentUser.email) return;

    const messageToSend: any = { 
      id: Date.now().toString() + Math.random().toString(36).slice(2, 9),
      channel_id: activeChannelId,
      user_id: currentUser.id,
      sender_name: currentUser.name || currentUser.email.split('@')[0],
      created_at: new Date().toISOString(),
    };
    if (text && text.trim()) messageToSend.text = text.trim();
    if (attachment) messageToSend.attachment = attachment;
    
    gun.get('pixasocial/chat/messages').get(activeChannelId).get(messageToSend.id).put(messageToSend, (ack) => {
        if ((ack as any).err) showToast(`Error sending message: ${(ack as any).err}`, 'error');
    });

    setMessageInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [activeChannelId, currentUser, showToast]);

  const handleEditMessage = useCallback((msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text || '');
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingMessageId) return;
    const originalMessage = currentChannelMessages.find(m => m.id === editingMessageId);
    if (!originalMessage) return;

    const updatedMessage = {
      ...originalMessage,
      text: editingText.trim(),
      updated_at: new Date().toISOString(),
    };
    gun.get('pixasocial/chat/messages').get(activeChannelId).get(editingMessageId).put(updatedMessage);
    setEditingMessageId(null);
    setEditingText('');
  }, [editingMessageId, editingText, activeChannelId, currentChannelMessages]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if(window.confirm("Are you sure you want to delete this message?")) {
      gun.get('pixasocial/chat/messages').get(activeChannelId).get(messageId).put(null as any);
    }
  }, [activeChannelId]);
  
  const handleFileAttach = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_CHAT_FILE_TYPES.includes(file.type)) {
        showToast(`Unsupported file type.`, 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) { 
        showToast(`File is too large (${formatBytes(file.size)}). Max 5MB.`, 'error');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const attachmentInfo: ChatMessageAttachment = { name: file.name, type: file.type, size: file.size, publicUrl: '' };

      if (file.type.startsWith('image/') && file.size < CHAT_IMAGE_PREVIEW_MAX_SIZE_BYTES) {
        const reader = new FileReader();
        reader.onloadend = () => {
          attachmentInfo.publicUrl = reader.result as string;
          sendMessage(messageInput, attachmentInfo); 
        };
        reader.onerror = () => {
          showToast('Failed to read image for preview.', 'error');
          sendMessage(messageInput, attachmentInfo);
        };
        reader.readAsDataURL(file);
      } else {
        sendMessage(messageInput, attachmentInfo);
      }
    }
  }, [showToast, sendMessage, messageInput]);

  return (
    <div className="flex h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] bg-background border border-lightBorder rounded-lg overflow-hidden">
      <ChatSidebar 
        currentUser={currentUser}
        teamMembers={teamMembers}
        customChannels={customChannels}
        onAddCustomChannel={onAddCustomChannel}
        onRemoveCustomChannel={onRemoveCustomChannel}
        activeChannelId={activeChannelId}
        setActiveChannelId={setActiveChannelId}
      />
      <main className="flex-1 flex flex-col bg-card">
        <ChatMessages
          currentUser={currentUser}
          messages={currentChannelMessages}
          isLoading={isLoadingMessages}
          activeChannelId={activeChannelId}
          customChannels={customChannels}
          teamMembers={teamMembers}
          editingMessageId={editingMessageId}
          editingText={editingText}
          setEditingText={setEditingText}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingMessageId(null)}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />

        <div className="p-4 border-t border-lightBorder bg-card">
          <div className="bg-background rounded-lg p-2 flex items-start space-x-2">
            <input type="file" ref={fileInputRef} onChange={handleFileAttach} className="hidden" id="chat-file-input" accept={ACCEPTED_CHAT_FILE_TYPES.join(',')} />
            <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} aria-label="Attach file" className="h-10 w-10 shrink-0">
              <PaperClipIcon className="w-5 h-5 text-textSecondary hover:text-primary"/>
            </Button>
            <Textarea
              value={messageInput}
              onChange={e => setMessageInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(messageInput); }}}
              placeholder={`Message...`}
              className="flex-1 text-sm resize-none bg-transparent border-none focus:ring-0"
              containerClassName="mb-0 flex-grow"
              aria-label="Message input"
            />
            <Button variant="primary" size="icon" onClick={() => sendMessage(messageInput)} disabled={!messageInput.trim()} aria-label="Send message" className="h-10 w-10 shrink-0">
              <PaperAirplaneIcon className="w-5 h-5"/>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};