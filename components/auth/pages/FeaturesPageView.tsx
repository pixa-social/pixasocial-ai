
import React from 'react';
import { Card } from '../../ui/Card';
import { 
  UsersIcon, BeakerIcon, DocumentTextIcon, CalendarDaysIcon, 
  ChatBubbleLeftEllipsisIcon, ShieldCheckIcon, CheckCircleIcon, XCircleIcon 
} from '../../ui/Icons';
import { APP_TITLE } from '../../../constants';

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
    const comparisonData = [
    {
      feature: 'Psychographic personas',
      pixasocial: { icon: <CheckCircleIcon className="w-5 h-5 text-success" />, text: 'AI-driven' },
      buffer: { icon: <XCircleIcon className="w-5 h-5 text-destructive" /> },
      hootsuite: { icon: <XCircleIcon className="w-5 h-5 text-destructive" /> },
      sprout: { icon: <XCircleIcon className="w-5 h-5 text-destructive" /> },
    },
    {
      feature: 'Message science engine',
      pixasocial: { icon: <CheckCircleIcon className="w-5 h-5 text-success" />, text: 'Persona-based' },
      buffer: { icon: <XCircleIcon className="w-5 h-5 text-destructive" /> },
      hootsuite: { icon: <XCircleIcon className="w-5 h-5 text-destructive" /> },
      sprout: { icon: <XCircleIcon className="w-5 h-5 text-destructive" /> },
    },
    {
      feature: 'Auto A/B by persona',
      pixasocial: { icon: <CheckCircleIcon className="w-5 h-5 text-success" /> },
      buffer: { text: 'Manual' },
      hootsuite: { text: 'Manual' },
      sprout: { text: 'Manual' },
    },
    {
      feature: 'Sentiment analysis',
      pixasocial: { icon: <CheckCircleIcon className="w-5 h-5 text-success" /> },
      buffer: { icon: <XCircleIcon className="w-5 h-5 text-destructive" /> },
      hootsuite: { icon: <XCircleIcon className="w-5 h-5 text-destructive" /> },
      sprout: { icon: <XCircleIcon className="w-5 h-5 text-destructive" /> },
    },
    {
      feature: 'Free tier personas',
      pixasocial: { text: '1' },
      buffer: { text: '0' },
      hootsuite: { text: '0' },
      sprout: { text: '0' },
    },
  ];

  const renderCellContent = (data?: { icon?: React.ReactNode; text?: string }) => {
    if (!data) return <span className="text-muted-foreground/60">-</span>;
    return (
      <div className="flex items-center gap-2">
        {data.icon}
        {data.text && <span className="font-medium">{data.text}</span>}
      </div>
    );
  };
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

        {/* Comparison Table */}
        <div className="mt-24 text-center">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            How We <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Measure Up</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            See how {APP_TITLE} compares to other leading platforms.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border/50 bg-card/40 shadow-xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-border/50 bg-card/60">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold text-foreground">Feature</th>
                  <th className="px-6 py-4 text-sm font-semibold text-primary">{APP_TITLE}</th>
                  <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Buffer</th>
                  <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Hootsuite</th>
                  <th className="px-6 py-4 text-sm font-semibold text-muted-foreground">Sprout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {comparisonData.map((row) => (
                  <tr key={row.feature} className="transition-colors hover:bg-muted/30">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{row.feature}</td>
                    <td className="px-6 py-4 text-sm">{renderCellContent(row.pixasocial)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{renderCellContent(row.buffer)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{renderCellContent(row.hootsuite)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{renderCellContent(row.sprout)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
