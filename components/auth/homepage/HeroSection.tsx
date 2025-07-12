import React from 'react';
import { Button } from '@/components/ui/Button';
import { AuthViewType } from '@/types';
import { ArrowRight, Sparkles, Zap, Target } from 'lucide-react';

interface HeroSectionProps {
  setAuthView: (view: AuthViewType) => void;
  title?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  setAuthView,
  title = "Welcome to PixaSocial Ai",
  description = "The most powerful social media and messaging platform on the planet, trained on over 14 billion parameters to deliver unparalleled precision and impact. Unlike traditional tools like Buffer or Hootsuite, PixaSocial Ai combines cutting-edge AI, behavioral psychology, and social media mastery to transform how you connect with your audience. Our revolutionary approach ensures your content doesn't just reach people—it resonates, engages, and drives action.",
  primaryButtonText = "Get Started Free",
  secondaryButtonText = "Login"
}) => {
  return (
    <div className="relative bg-background overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/10 dark:to-pink-950/20" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Powered by 14 Billion Parameters</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button size="lg" className="px-8 py-6 text-lg font-semibold group" onClick={() => setAuthView('register')}>
              {primaryButtonText}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-6 text-lg font-semibold" onClick={() => setAuthView('login')}>
              {secondaryButtonText}
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">Advanced algorithms that understand your audience</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Precision Targeting</h3>
              <p className="text-sm text-muted-foreground">Reach the right people at the right time</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Maximum Impact</h3>
              <p className="text-sm text-muted-foreground">Content that resonates and drives action</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
};
