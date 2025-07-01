import React from 'react';
import { ChatMessage, User } from '../../types';
import { PaperClipIcon } from '../ui/Icons';
import { format } from 'date-fns';

interface ChatMessageItemProps {
  msg: ChatMessage;
  currentUser: User;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

const ChatMessageItemComponent: React.FC<ChatMessageItemProps> = ({ msg, currentUser }) => {
  const isCurrentUser = msg.senderEmail === currentUser.email;
  return (
    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg shadow ${
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
              <img src={msg.attachment.dataUrl} alt="Preview" className="mt-1 max-w-[100px] max-h-20 rounded object-contain" />
            )}
          </div>
        )}
        <p className={`text-xxs mt-1.5 ${isCurrentUser ? 'text-right opacity-70' : 'text-left opacity-60'}`}>
          {format(new Date(msg.timestamp), 'p')}
        </p>
      </div>
    </div>
  );
};

export const ChatMessageItem = React.memo(ChatMessageItemComponent);
