
import React from 'react';
import { UserProfile } from '../../types';
import { Avatar } from '../ui/Avatar';
import { PaperClipIcon } from '../ui/Icons';

interface SocialPostPreviewProps {
  user: UserProfile;
  text: string;
  imagePreviews: string[];
  nonImageFileCount: number;
}

export const SocialPostPreview: React.FC<SocialPostPreviewProps> = ({ user, text, imagePreviews, nonImageFileCount }) => {
  return (
    <div className="mt-4 p-4 border border-border rounded-lg bg-background animate-fadeIn">
      <div className="flex items-start space-x-3">
        <Avatar name={user.name || 'User'} size="md" />
        <div className="flex-1">
          <p className="font-semibold text-foreground">{user.name || 'Your Name'}</p>
          <p className="text-sm text-muted-foreground">@{user.name?.toLowerCase().replace(/\s+/g, '') || 'username'}</p>
        </div>
      </div>
      <div className="mt-3 space-y-3">
        {text && <p className="text-sm text-foreground whitespace-pre-wrap break-words">{text}</p>}
        
        {imagePreviews.length > 0 && (
          <div className={`grid gap-1 ${imagePreviews.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} ${imagePreviews.length === 3 ? 'grid-rows-2' : ''} aspect-video`}>
            {imagePreviews.map((src, index) => {
                let gridClass = '';
                if (imagePreviews.length === 2) gridClass = 'col-span-1';
                if (imagePreviews.length === 3) {
                    if (index === 0) gridClass = 'col-span-2 row-span-2';
                    else gridClass = 'col-span-1';
                }
                 if (imagePreviews.length === 4) gridClass = 'col-span-1';

                return (
                    <div key={index} className={`relative overflow-hidden rounded-lg ${gridClass}`}>
                        <img src={src} alt={`Preview ${index + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                )
            })}
          </div>
        )}
        
        {nonImageFileCount > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-card border border-border">
                <PaperClipIcon className="w-5 h-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{nonImageFileCount} other file(s) attached</p>
            </div>
        )}

         {!text && imagePreviews.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-6">
                Your post preview will appear here.
            </div>
        )}
      </div>
    </div>
  );
};
