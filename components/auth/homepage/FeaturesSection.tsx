import React from 'react';
import { APP_TITLE } from '../../../constants';
import { Card } from '../../ui/Card';
import {
  Globe,
  BrainCircuit,
  Users,
  Settings2,
  Sparkles,
  Target,
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const whyPixasocialPoints = [
    {
      icon: <Target className="h-8 w-8 text-white" />,
      title: 'Unmatched Personalization',
      description:
        'Go beyond demographics to understand your audience’s values and motivations. Our AI crafts tailored content that speaks directly to them.',
    },
    {
      icon: <BrainCircuit className="h-8 w-8 text-white" />,
      title: 'Behavioral Intelligence',
      description:
        'Our model, trained on 14 billion parameters, analyzes data to predict and adapt to audience behavior, ensuring your message is always relevant and impactful.',
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: 'Psychology-Driven Engagement',
      description:
        'Leveraging principles of behavioral psychology, our platform uses subtle cues to boost engagement, turning passive viewers into active participants.',
    },
    {
      icon: <Settings2 className="h-8 w-8 text-white" />,
      title: 'Customized Algorithms',
      description:
        'Our AI doesn’t just schedule posts—it optimizes them with algorithms that evolve based on your unique goals and audience.',
    },
    {
      icon: <Sparkles className="h-8 w-8 text-white" />,
      title: 'Seamless and Intuitive',
      description:
        'Analyze performance, refine strategies, and manage your social presence with an intuitive dashboard that adapts to your needs.',
    },
    {
      icon: <Globe className="h-8 w-8 text-white" />,
      title: 'Global Reach, Local Impact',
      description:
        'Empower creators and businesses worldwide to amplify their influence with tools designed for the modern digital landscape.',
    },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-background via-background/90 to-background px-4 py-20 sm:py-24 lg:py-32">
      {/* subtle animated gradient orb */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-accent to-primary opacity-20 blur-3xl animate-pulse [animation-delay:1.5s]" />

      <div className="relative mx-auto max-w-7xl">
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Why {APP_TITLE} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Stands Out</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            A toolkit built on behavioral psychology and advanced AI to give you a strategic edge.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyPixasocialPoints.map(({ icon, title, description }) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-border/50 bg-card/40 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-accent/20 hover:shadow-2xl"
            >
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white shadow-md">
                {icon}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
