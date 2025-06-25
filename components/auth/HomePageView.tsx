
import React from 'react';
import { Button } from '../ui/Button';
import { APP_TITLE } from '../../constants';
import { AuthViewType } from '../../types';
import { Card } from '../ui/Card'; // Card might be useful for the "Why" section

interface HomePageViewProps {
  setAuthView: (view: AuthViewType) => void;
}

export const HomePageView: React.FC<HomePageViewProps> = ({ setAuthView }) => {
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
    <div className="py-12 sm:py-16 lg:py-20 text-white">
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          Welcome to <span className="text-accent">{APP_TITLE}</span>
        </h2>
        <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
          The most powerful social media and messaging platform on the planet, trained on over 14 billion parameters to deliver unparalleled precision and impact. Unlike traditional tools like Buffer or Hootsuite, {APP_TITLE} combines cutting-edge AI, behavioral psychology, and social media mastery to transform how you connect with your audience. Our revolutionary approach ensures your content doesn’t just reach people—it resonates, engages, and drives action.
        </p>
      </div>

      <div className="mt-16 sm:mt-20 lg:mt-24 max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
            <h3 className="text-3xl font-bold">Why {APP_TITLE} Stands Out</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
          {whyPixasocialPoints.map((point) => (
            <div key={point.title} className="p-6 bg-gray-800 bg-opacity-40 border border-gray-700 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-300">
              <h4 className="text-2xl font-semibold text-accent mb-3">{point.title}</h4>
              <p className="text-gray-300 text-base leading-relaxed">{point.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-16 sm:mt-20 lg:mt-24 max-w-4xl mx-auto text-center px-4">
        <h3 className="text-3xl font-bold tracking-tight text-white mb-6">
          Get Started Today
        </h3>
        <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
          Join the future of social engagement. Sign up for a free trial and experience the most powerful platform where AI meets psychology to make your message unstoppable.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-x-6">
          <Button
            size="lg"
            variant="primary"
            className="bg-accent hover:bg-emerald-600 text-white shadow-lg transform hover:scale-105 transition-transform w-full sm:w-auto"
            onClick={() => setAuthView('register')}
          >
            Get Started Free
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-gray-200 bg-gray-700 hover:bg-gray-600 hover:text-white shadow-lg transform hover:scale-105 transition-transform w-full sm:w-auto"
            onClick={() => setAuthView('login')}
          >
            Login to Your Account
          </Button>
        </div>
      </div>
    </div>
  );
};
