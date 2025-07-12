import React from 'react';
import { APP_TITLE } from '../../../constants';
import { Card } from '../../ui/Card';
import { Globe, BrainCircuit, Users, Settings2, Sparkles, Target } from 'lucide-react';

/**
 * A section to highlight the key features and value propositions of the application on the homepage.
 */
export const FeaturesSection: React.FC = () => {
  // Array of feature points with corresponding icons, titles, and descriptions.
  const whyPixasocialPoints = [
    {
      icon: <Target className="h-8 w-8 text-accent" />,
      title: "Unmatched Personalization",
      description: "Go beyond demographics to understand your audience’s values and motivations. Our AI crafts tailored content that speaks directly to them."
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-accent" />,
      title: "Behavioral Intelligence",
      description: "Our model, trained on 14 billion parameters, analyzes data to predict and adapt to audience behavior, ensuring your message is always relevant and impactful."
    },
    {
      icon: <Users className="h-8 w-8 text-accent" />,
      title: "Psychology-Driven Engagement",
      description: "Leveraging principles of behavioral psychology, our platform uses subtle cues to boost engagement, turning passive viewers into active participants."
    },
    {
      icon: <Settings2 className="h-8 w-8 text-accent" />,
      title: "Customized Algorithms",
      description: "Our AI doesn’t just schedule posts—it optimizes them with algorithms that evolve based on your unique goals and audience."
    },
    {
      icon: <Sparkles className="h-8 w-8 text-accent" />,
      title: "Seamless and Intuitive",
      description: "Analyze performance, refine strategies, and manage your social presence with an intuitive dashboard that adapts to your needs."
    },
    {
      icon: <Globe className="h-8 w-8 text-accent" />,
      title: "Global Reach, Local Impact",
      description: "Empower creators and businesses worldwide to amplify their influence with tools designed for the modern digital landscape."
    }
  ];

  return (
    // Section container with a semi-transparent background and vertical padding.
    <section className="bg-gray-900/50 py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Why {APP_TITLE} Stands Out
          </h2>
          <p className="mt-4 text-lg leading-6 text-textSecondary max-w-2xl mx-auto">
            A toolkit built on behavioral psychology and advanced AI to give you a strategic edge.
          </p>
        </div>

        {/* Grid container for the feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {whyPixasocialPoints.map((point) => (
            // Each card is wrapped in a relative div with a group class for the hover effect.
            <div key={point.title} className="relative group">
              {/* This div creates the glowing border effect on hover. */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-0 group-hover:opacity-75 transition duration-500"></div>
              {/* The Card component itself is relative to appear above the glow. */}
              <Card className="relative p-6 h-full flex flex-col">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-white">
                    {point.icon}
                  </div>
                </div>
                <div className="mt-4 flex-grow">
                  <h3 className="text-lg font-medium text-textPrimary">{point.title}</h3>
                  <p className="mt-2 text-base text-textSecondary">
                    {point.description}
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
