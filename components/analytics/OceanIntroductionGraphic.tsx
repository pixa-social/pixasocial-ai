import React from 'react';
import { Card } from '../ui/Card';

const OceanIntroductionGraphic: React.FC = () => {
  return (
    <Card className="mb-6 bg-card border-lightBorder">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-primary">OCEAN Personality Model</h3>
        <p className="text-textSecondary mt-2 max-w-3xl mx-auto">
          This tool analyzes your persona against the "Big Five" OCEAN personality traits to provide deeper psychological insights. Each trait represents a spectrum, and a persona's scores indicate their tendencies.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
        <div className="p-3 bg-background rounded-lg">
          <h4 className="font-semibold text-textPrimary">Openness</h4>
          <p className="text-xs text-textSecondary">(Creativity)</p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <h4 className="font-semibold text-textPrimary">Conscientiousness</h4>
          <p className="text-xs text-textSecondary">(Organization)</p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <h4 className="font-semibold text-textPrimary">Extraversion</h4>
          <p className="text-xs text-textSecondary">(Sociability)</p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <h4 className="font-semibold text-textPrimary">Agreeableness</h4>
          <p className="text-xs text-textSecondary">(Kindness)</p>
        </div>
        <div className="p-3 bg-background rounded-lg">
          <h4 className="font-semibold text-textPrimary">Neuroticism</h4>
          <p className="text-xs text-textSecondary">(vs. Emotional Stability)</p>
        </div>
      </div>
    </Card>
  );
};

export default OceanIntroductionGraphic;