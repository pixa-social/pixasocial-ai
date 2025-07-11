import React from 'react';
import { APP_TITLE } from '../../../constants';
import { Card } from '../../ui/Card';

interface FeaturesSectionProps {}

export const FeaturesSection: React.FC<FeaturesSectionProps> = () => {
  const whyPixasocialPoints = [
    {
      title: "Unmatched Personalization",
      description: "Powered by advanced psychographic insights, we go beyond demographics to understand your audience’s values, motivations, and emotional triggers. Our AI crafts tailored content that speaks directly to their hearts and minds."
    },
    {
      title: "Behavioral Intelligence at Scale",
      description: "With a model trained on 14 billion parameters, Pixasocial AI analyzes vast amounts of data to predict and adapt to your audience’s behavior. This ensures your message is always relevant, timely, and impactful."
    },
    {
      title: "Psychology-Driven Engagement",
      description: "Leveraging principles of behavioral psychology, our platform uses subtle cues and triggers to boost engagement, turning passive viewers into active participants."
    },
    {
      title: "Customized Algorithms for You",
      description: "Our AI doesn’t just schedule posts—it optimizes them. With algorithms that evolve based on your unique goals and audience, Pixasocial AI delivers a truly personalized experience that grows with you."
    },
    {
      title: "Seamless and Intuitive",
      description: "Analyze performance, refine strategies, and manage your social presence with an intuitive dashboard that adapts to your needs—making social media management effortless and effective."
    },
    {
      title: "Global Reach, Local Impact",
      description: "Empower creators, businesses, and communities worldwide to amplify their influence with tools designed for the modern digital landscape."
    }
  ];

  return (
    <div className="mt-16 sm:mt-20 lg:mt-24 max-w-5xl mx-auto px-4 animate-fade-in-up" style={{ animationDelay: '600ms', opacity: 0 }}>
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold">Why {APP_TITLE} Stands Out</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {whyPixasocialPoints.map((point, index) => (
          <Card key={point.title} className="group transform transition-transform duration-300 hover:-translate-y-2">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
            <div className="relative">
              <h4 className="text-2xl font-semibold text-accent mb-3">{point.title}</h4>
              <p className="text-gray-300 text-base leading-relaxed">{point.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};