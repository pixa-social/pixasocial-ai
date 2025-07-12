import React from 'react';
import { AuthViewType } from '../../types';
import { HeroSection } from './homepage/HeroSection';
import { FeaturesSection } from './homepage/FeaturesSection';
import { BannerFeatureSection } from './homepage/BannerFeatureSection';
import { TestimonialSection } from './homepage/TestimonialSection';

interface HomePageViewProps {
  setAuthView: (view: AuthViewType) => void;
}

export const HomePageView: React.FC<HomePageViewProps> = ({ setAuthView }) => {
  return (
    // The main container for the homepage, setting a base background color.
    <div className="relative overflow-hidden bg-background">
      {/* The HeroSection is the main landing view. */}
      <HeroSection setAuthView={setAuthView} />
      
      {/* This section highlights the key features and value propositions of the app. */}
      <FeaturesSection />

      {/* This section showcases the banner creation feature. */}
      <BannerFeatureSection />

      {/* This section provides social proof through customer testimonials. */}
      <div className="py-16 sm:py-20 lg:py-24">
        <TestimonialSection />
      </div>
    </div>
  );
};
