import React from 'react';
import { AuthViewType } from '../../types';
import { HeroSection } from './homepage/HeroSection';
import { FeaturesSection } from './homepage/FeaturesSection';
import { CtaSection } from './homepage/CtaSection';

interface HomePageViewProps {
  setAuthView: (view: AuthViewType) => void;
}

export const HomePageView: React.FC<HomePageViewProps> = ({ setAuthView }) => {
  return (
    <div className="relative overflow-hidden">
        <div className="absolute inset-0 aurora-bg -z-10"></div>
        <div className="relative z-10 py-12 sm:py-16 lg:py-20">
            <HeroSection />
            <FeaturesSection />
            <CtaSection setAuthView={setAuthView} />
        </div>
    </div>
  );
};