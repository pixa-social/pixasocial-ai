import React from 'react';
import { Card } from './ui/Card';

const RstIntroductionGraphic: React.FC = () => {
  const personaImageUrl = "https://img.freepik.com/premium-photo/woman-with-glasses_826801-988.jpg"; // Central persona image

  const rstItems = [
    {
      label: "BAS",
      description: "Do they seek rewards? Are they motivated by gains or incentives?",
    },
    {
      label: "BIS",
      description: "Do they avoid risks? Are they sensitive to potential threats?",
    },
    {
      label: "FFFS",
      description: "Do they respond to danger? Are they driven by fear or urgency?",
    },
  ];

  return (
    <Card className="mb-6 border-none shadow-none bg-transparent px-0 py-4">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-danger mb-3">
          RST Personality Model
        </h1>
        <p className="text-lg text-textSecondary max-w-3xl mx-auto mb-8">
          We use the established scientific RST scale of behavioral traits to understand what drives people’s actions, how they react to stimuli, and what truly motivates their decisions in campaigns.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          {/* BAS */}
          <div className="flex flex-col items-center text-center">
            <div className="w-36 h-36 md:w-40 md:h-40 border-4 border-danger rounded-full flex items-center justify-center text-danger text-3xl font-bold mb-3">
              {rstItems[0].label}
            </div>
            <p className="text-sm text-textSecondary max-w-[150px]">{rstItems[0].description}</p>
          </div>

          {/* Central Image */}
          <div className="order-first md:order-none">
            <img 
              src={personaImageUrl} 
              alt="Persona Representation" 
              className="w-40 h-40 md:w-48 md:h-48 rounded-full object-cover shadow-lg border-4 border-white"
            />
          </div>
          
          {/* BIS */}
          <div className="flex flex-col items-center text-center">
            <div className="w-36 h-36 md:w-40 md:h-40 border-4 border-danger rounded-full flex items-center justify-center text-danger text-3xl font-bold mb-3">
              {rstItems[1].label}
            </div>
            <p className="text-sm text-textSecondary max-w-[150px]">{rstItems[1].description}</p>
          </div>

          {/* FFFS - Appears next on smaller screens, or last on medium+ */}
           <div className="flex flex-col items-center text-center md:hidden"> {/* Only show for stacked layout on small screens */}
            <div className="w-36 h-36 border-4 border-danger rounded-full flex items-center justify-center text-danger text-3xl font-bold mb-3">
              {rstItems[2].label}
            </div>
            <p className="text-sm text-textSecondary max-w-[150px]">{rstItems[2].description}</p>
          </div>
        </div>
         {/* FFFS - Show this for side-by-side layout on medium+ screens */}
        <div className="hidden md:flex md:flex-col md:items-center md:text-center md:mt-0 md:ml-8">
            <div className="w-36 h-36 md:w-40 md:h-40 border-4 border-danger rounded-full flex items-center justify-center text-danger text-3xl font-bold mb-3">
              {rstItems[2].label}
            </div>
            <p className="text-sm text-textSecondary max-w-[150px]">{rstItems[2].description}</p>
        </div>
      </div>
    </Card>
  );
};

export default RstIntroductionGraphic;
