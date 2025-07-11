import React from 'react';
import { APP_TITLE } from '../../../constants';

interface HeroSectionProps {
}

export const HeroSection: React.FC<HeroSectionProps> = () => {
  return (
    <div className="max-w-4xl mx-auto text-center px-4 animate-fade-in-up" style={{ animationDelay: '200ms', opacity: 0 }}>
      <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
        Welcome to <span className="text-accent">{APP_TITLE}</span>
      </h2>
      <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '400ms', opacity: 0 }}>
        The most powerful social media and messaging platform on the planet, trained on over 14 billion parameters to deliver unparalleled precision and impact. Unlike traditional tools like Buffer or Hootsuite, {APP_TITLE} combines cutting-edge AI, behavioral psychology, and social media mastery to transform how you connect with your audience. Our revolutionary approach ensures your content doesn’t just reach people—it resonates, engages, and drives action.
      </p>
    </div>
  );
};