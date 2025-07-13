import React from 'react';
import { format } from 'date-fns';
import { ChatMessage, User } from '../../types';
import { PaperClipIcon, PencilIcon, TrashIcon } from '../ui/Icons';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface ChatMessageItemProps {
  msg: ChatMessage;
  currentUser: User;
  isFirstInGroup: boolean;
  onEdit: (msg: ChatMessage) => void;
  onDelete: (messageId: string) => void;
  isEditing: boolean;
  editingText: string;
  setEditingText: (text: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const ChatMessageItemComponent: React.FC<ChatMessageItemProps> = ({
  msg,
  currentUser,
  isFirstInGroup,
  onEdit,
  onDelete,
  isEditing,
  editingText,
  setEditingText,
  onSaveEdit,
  onCancelEdit,
}) => {
  const isCurrentUser = msg.user_id === currentUser.id;

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSaveEdit();
    }
    if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const messageContent = (
    <div
      className={`relative group flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`mt-1 ${isFirstInGroup ? 'opacity-100' : 'opacity-0'}`}>
        {!isCurrentUser && <Avatar name={msg.sender_name} size="sm" />}
      </div>

      {/* Message Bubble */}
      <div
        className={`w-full max-w-md lg:max-w-lg rounded-lg px-3 py-2 shadow-sm
          ${isCurrentUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-card text-card-foreground rounded-bl-none'
          }`}
      >
        {isFirstInGroup && !isCurrentUser && (
          <p className="text-xs font-bold text-accent mb-1">{msg.sender_name}</p>
        )}
        
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={handleEditKeyDown}
              className="w-full bg-background text-foreground p-2 rounded-md border border-primary focus:ring-primary focus:outline-none text-sm"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end items-center gap-2 text-xs">
                 <p>escape to <button type="button" className="underline" onClick={onCancelEdit}>cancel</button> • enter to <button type="button" className="underline" onClick={onSaveEdit}>save</button></p>
            </div>
          </div>
        ) : (
          <>
            {msg.text && (
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
            )}
            {msg.attachment && (
              <div className={`mt-2 p-2 rounded-md ${isCurrentUser ? 'bg-primary/80' : 'bg-background'}`}>
                <div className="flex items-center space-x-2">
                  <PaperClipIcon className={`w-5 h-5 ${isCurrentUser ? 'text-blue-100' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium truncate ${isCurrentUser ? 'text-blue-50' : 'text-foreground'}`} title={msg.attachment.name}>
                    {msg.attachment.name}
                  </span>
                </div>
                <p className={`text-xxs mt-0.5 opacity-80 ${isCurrentUser ? 'text-blue-200' : 'text-muted-foreground'}`}>
                  {msg.attachment.type} - {formatBytes(msg.attachment.size)}
                </p>
                {msg.attachment.publicUrl && msg.attachment.type.startsWith('image/') && (
                  <img src={msg.attachment.publicUrl} alt="Preview" className="mt-2 max-w-[150px] max-h-24 rounded object-contain" />
                )}
              </div>
            )}
            <div className={`text-xxs mt-1.5 opacity-60 ${isCurrentUser ? 'text-right' : 'text-left'}`}>
              {msg.updated_at && <span className="italic mr-1">(edited)</span>}
              {format(new Date(msg.created_at), 'p')}
            </div>
          </>
        )}
      </div>

      {/* Hover Actions */}
      {isCurrentUser && !isEditing && (
        <div className="flex-shrink-0 self-center flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(msg)} title="Edit Message">
            <PencilIcon className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(msg.id)} title="Delete Message">
            <TrashIcon className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      )}
    </div>
  );

  return <div className={`py-0.5 ${isFirstInGroup ? 'mt-3' : ''}`}>{messageContent}</div>;
};

export const ChatMessageItem = React.memo(ChatMessageItemComponent);