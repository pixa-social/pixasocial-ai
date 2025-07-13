import React from 'react';
import { AuthViewType } from '../../types';
import { HeroSection } from './homepage/HeroSection';
import { FeaturesSection } from './homepage/FeaturesSection';
import { BannerFeatureSection } from './homepage/BannerFeatureSection';
import PixaSocialSections from './homepage/PixaSocialSections';

interface HomePageViewProps {
  setAuthView: (view: AuthViewType) => void;
}

export const HomePageView: React.FC<HomePageViewProps> = ({ setAuthView }) => {
  return (
    // The main container for the homepage, setting a base background color.
    <div className="relative overflow-hidden bg-background">
      {/* The HeroSection is the main landing view. */}
      <HeroSection setAuthView={setAuthView} />

      {/* Inserted the new sections component */}
      <PixaSocialSections />
      
      {/* This section highlights the key features and value propositions of the app. */}
      <FeaturesSection />

      {/* This section showcases the banner creation feature. */}
      <BannerFeatureSection />
    </div>
  );
};