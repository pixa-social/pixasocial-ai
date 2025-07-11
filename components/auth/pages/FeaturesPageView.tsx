import React from 'react';
import { Card } from '../../ui/Card';
import { 
  UsersIcon, BeakerIcon, DocumentTextIcon, CalendarDaysIcon, 
  ChatBubbleLeftEllipsisIcon, ShieldCheckIcon 
} from '../../ui/Icons';

const features = [
  {
    icon: <UsersIcon className="w-10 h-10 text-primary" />,
    title: 'Audience Modeling',
    description: 'Go beyond demographics. Build detailed audience personas using psychological frameworks like Reinforcement Sensitivity Theory (RST) to understand what truly motivates your audience.'
  },
  {
    icon: <BeakerIcon className="w-10 h-10 text-accent" />,
    title: 'Operator Builder',
    description: 'Craft powerful campaign mechanics based on proven conditioning principles. Design "Operators" like Hope, Fear, or Belonging to strategically influence perception and drive engagement.'
  },
  {
    icon: <DocumentTextIcon className="w-10 h-10 text-yellow-500" />,
    title: 'AI Content Planner',
    description: 'Generate tailored content drafts for multiple platforms (X, Facebook, etc.). The AI creates text, image prompts, and video ideas aligned with your specific personas and operators.'
  },
  {
    icon: <ChatBubbleLeftEllipsisIcon className="w-10 h-10 text-purple-400" />,
    title: 'Feedback Simulator',
    description: 'Predict audience reactions before you publish. Our AI simulates potential feedback, sentiment, and engagement levels to help you refine your message and mitigate risks.'
  },
  {
    icon: <ShieldCheckIcon className="w-10 h-10 text-danger" />,
    title: '8D Audit Tool',
    description: 'Apply the rigorous 8D (Eight Disciplines) problem-solving process to your campaigns. Let our AI help you plan, troubleshoot, and ensure strategic alignment from start to finish.'
  },
  {
    icon: <CalendarDaysIcon className="w-10 h-10 text-blue-400" />,
    title: 'Integrated Campaign Management',
    description: 'Plan, draft, schedule, and manage all your assets in one place. Includes an interactive calendar, a central content library, and a real-time team chat for seamless collaboration.'
  }
];

export const FeaturesPageView: React.FC = () => {
  return (
    <div className="bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Our Features</h2>
          <p className="mt-2 text-3xl font-extrabold text-textPrimary sm:text-4xl">
            A Better Way to Engage
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-textSecondary">
            PixaSocial AI provides a suite of powerful, integrated tools designed to give you an unparalleled strategic advantage.
          </p>
        </div>

        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={feature.title} className="animate-fade-in-up" style={{ animationDelay: `${index * 100}ms`, opacity: 0 }}>
                <Card className="pt-6 h-full group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-xl blur opacity-0 group-hover:opacity-60 transition duration-500"></div>
                    <div className="relative flow-root bg-card rounded-lg px-6 pb-8 h-full">
                        <div className="-mt-6">
                            <div>
                            <span className="inline-flex items-center justify-center p-3 bg-primary rounded-md shadow-lg">
                                {React.cloneElement(feature.icon, { className: 'h-6 w-6 text-white' })}
                            </span>
                            </div>
                            <h3 className="mt-8 text-lg font-medium text-textPrimary tracking-tight">{feature.title}</h3>
                            <p className="mt-5 text-base text-textSecondary">
                            {feature.description}
                            </p>
                        </div>
                    </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};