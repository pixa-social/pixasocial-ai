import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ViewName } from '../../types';
import { 
    XMarkIcon, ArrowRightIcon, UsersIcon, BeakerIcon, 
    DocumentTextIcon, ChartPieIcon, CalendarDaysIcon 
} from '../ui/Icons';

interface OnboardingGuideProps {
  onDismiss: () => void;
  onNavigate: (view: ViewName) => void;
}

interface Step {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  viewName: ViewName;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const StepCard: React.FC<Step & { onNavigate: (view: ViewName) => void }> = ({
  step,
  title,
  description,
  icon,
  viewName,
  onNavigate,
}) => (
  <motion.div variants={itemVariants} className="flex flex-col text-center w-52 flex-shrink-0">
    <Card className="flex-1 p-4 bg-card/70 border-border/50 backdrop-blur-sm flex flex-col justify-between h-full">
      <div>
        <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
          {icon}
        </div>
        <h4 className="font-bold text-foreground">{step}. {title}</h4>
        <p className="text-xs text-muted-foreground mt-1 mb-3 min-h-[4.5rem]">{description}</p>
      </div>
      <Button size="sm" variant="secondary" onClick={() => onNavigate(viewName)}>
        Go to {title}
      </Button>
    </Card>
  </motion.div>
);

const FlowArrow: React.FC = () => (
  <motion.div variants={itemVariants} className="flex-shrink-0 self-center hidden md:flex items-center justify-center text-primary/70">
    <ArrowRightIcon className="w-8 h-8" />
  </motion.div>
);

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onDismiss, onNavigate }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const steps: Step[] = [
    {
      step: 1,
      title: 'Audience',
      description: 'Define your target audience with detailed, psychologically-driven personas. This is your foundation.',
      icon: <UsersIcon className="w-6 h-6" />,
      viewName: ViewName.AudienceModeling,
    },
    {
      step: 2,
      title: 'Operator',
      description: 'Design a campaign "Operator" based on psychological principles to influence your persona.',
      icon: <BeakerIcon className="w-6 h-6" />,
      viewName: ViewName.OperatorBuilder,
    },
    {
      step: 3,
      title: 'Content',
      description: 'Let AI generate tailored content for multiple platforms using your specific persona and operator.',
      icon: <DocumentTextIcon className="w-6 h-6" />,
      viewName: ViewName.ContentPlanner,
    },
    {
      step: 4,
      title: 'Analyze',
      description: 'Analyze persona psychographics and simulate audience feedback to refine your strategy.',
      icon: <ChartPieIcon className="w-6 h-6" />,
      viewName: ViewName.Analytics,
    },
    {
      step: 5,
      title: 'Schedule',
      description: 'Organize and schedule your generated content using the interactive calendar.',
      icon: <CalendarDaysIcon className="w-6 h-6" />,
      viewName: ViewName.Calendar,
    },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" exit="hidden">
      <Card
        title="Your Path to Strategic Engagement"
        className="mb-6 bg-gradient-to-br from-card to-card/80 border-primary/20"
      >
        <Button onClick={onDismiss} variant="ghost" size="sm" className="absolute top-4 right-4" aria-label="Dismiss guide">
          <XMarkIcon className="w-5 h-5" />
        </Button>
        <p className="text-sm text-muted-foreground -mt-2 mb-4 max-w-2xl">
          Welcome! Here's the recommended workflow to leverage the full power of PixaSocial Ai's psychology-driven approach.
        </p>

        <div className="-mx-7">
          <div className="flex items-stretch gap-2 md:gap-4 px-4 pb-4 overflow-x-auto">
            {steps.map((step, index) => (
              <React.Fragment key={step.step}>
                <StepCard {...step} onNavigate={onNavigate} />
                {index < steps.length - 1 && <FlowArrow />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};