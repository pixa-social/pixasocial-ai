import React from 'react';
import { Card } from '../ui/Card';

const BrmIntroductionGraphic: React.FC = () => {
  return (
    <Card className="mb-6 bg-card border-lightBorder">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-primary">Behavioral Resonance Model (BRM)</h3>
        <p className="text-textSecondary mt-2 max-w-3xl mx-auto">
          BRM is PixaSocial's unique framework for Pavlovian conditioning in campaigns. It profiles audience resonance factors using a radar chart with 11 axes, helping to identify levers to tailor stimuli for maximum impact.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-center text-xs text-muted-foreground">
        <div className="p-2 bg-background rounded">Overconfidence</div>
        <div className="p-2 bg-background rounded">Frame Exploit</div>
        <div className="p-2 bg-background rounded">Existing Belief</div>
        <div className="p-2 bg-background rounded">Following the Crowd</div>
        <div className="p-2 bg-background rounded">Appeal to Authority</div>
        <div className="p-2 bg-background rounded">Anger</div>
        <div className="p-2 bg-background rounded">Moralizing</div>
        <div className="p-2 bg-background rounded">Simplification</div>
        <div className="p-2 bg-background rounded">Directness</div>
        <div className="p-2 bg-background rounded">Social Pressure</div>
        <div className="p-2 bg-background rounded col-span-2 md:col-span-1 lg:col-span-1">Self-Affirmation</div>
      </div>
    </Card>
  );
};

export default BrmIntroductionGraphic;
