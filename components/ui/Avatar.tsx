
import React from 'react';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getInitials = (name: string): string => {
  if (!name) return '?';
  const names = name.split(' ');
  if (names.length > 1) {
    return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

export const Avatar: React.FC<AvatarProps> = ({ name, imageUrl, size = 'md', className = '' }) => {
  const containerSize = sizeClasses[size];

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`rounded-full object-cover ${containerSize} ${className}`}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center bg-secondary text-textPrimary font-bold ${containerSize} ${className}`}
      title={name}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
};
