import React from 'react';
import { Card } from './ui/Card';

const RstIntroductionGraphic: React.FC = () => {
  const personaImageUrl = "https://img.freepik.com/premium-photo/woman-with-glasses_826801-988.jpg";

  const rstItems = [
    {
      label: "BAS",
      description: "Do they seek rewards? Are they motivated by gains or incentives?",
      color: "border-primary",
      textColor: "text-primary"
    },
    {
      label: "BIS",
      description: "Do they avoid risks? Are they sensitive to potential threats?",
      color: "border-yellow-400",
      textColor: "text-yellow-400"
    },
    {
      label: "FFFS",
      description: "Do they respond to danger? Are they driven by fear or urgency?",
      color: "border-danger",
      textColor: "text-danger"
    },
  ];

  return (
    <Card className="mb-6 border-none shadow-none bg-transparent px-0 py-4">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3">
          RST Personality Model
        </h1>
        <p className="text-lg text-textSecondary max-w-3xl mx-auto mb-8">
          We use the established scientific RST scale of behavioral traits to understand what drives people’s actions, how they react to stimuli, and what truly motivates their decisions in campaigns.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          {rstItems.map((item, index) => (
            <div key={item.label} className={`flex flex-col items-center text-center ${index === 1 ? 'md:order-last' : ''}`}>
              <div className={`w-36 h-36 md:w-40 md:h-40 border-4 ${item.color} rounded-full flex items-center justify-center ${item.textColor} text-3xl font-bold mb-3`}>
                {item.label}
              </div>
              <p className="text-sm text-textSecondary max-w-[150px]">{item.description}</p>
            </div>
          ))}
          <div className="order-first md:order-none">
            <img 
              src={personaImageUrl} 
              alt="Persona Representation" 
              className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover shadow-lg border-4 border-gray-700"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RstIntroductionGraphic;