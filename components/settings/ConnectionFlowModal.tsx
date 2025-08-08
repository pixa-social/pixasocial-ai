import React, { useState, useCallback } from 'react';
import { SocialPlatformConnectionDetails, ConnectionOption, SocialPlatformType } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '../ui/Icons';

interface ConnectionFlowModalProps {
  platform: SocialPlatformConnectionDetails;
  onClose: () => void;
  onConnect: (platform: SocialPlatformType, connectionType: string) => void;
}

const ConnectionOptionCard: React.FC<{
  option: ConnectionOption;
  isSelected: boolean;
  onSelect: () => void;
  platformName: string;
}> = ({ option, isSelected, onSelect, platformName }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-primary bg-primary/10 shadow-lg' : 'border-lightBorder hover:border-mediumBorder'
      }`}
      role="radio"
      aria-checked={isSelected}
      tabIndex={0}
      onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
    >
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-bold text-textPrimary">{option.title}</h4>
        {option.recommended && (
          <span className="text-xs font-semibold bg-primary text-white px-2 py-1 rounded-full">Recommended</span>
        )}
      </div>
      <p className="text-sm text-textSecondary mt-1">{option.description}</p>
      <ul className="mt-4 space-y-2">
        {option.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <CheckCircleIcon className="w-5 h-5 text-success mr-2 shrink-0 mt-px" />
            <span className="text-sm text-textSecondary">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};


export const ConnectionFlowModal: React.FC<ConnectionFlowModalProps> = ({ platform, onClose, onConnect }) => {
  const [selectedOptionType, setSelectedOptionType] = useState<string | null>(
    platform.connectionOptions.find(opt => opt.recommended)?.type || platform.connectionOptions[0]?.type || null
  );

  const handleConnect = useCallback(() => {
    if (selectedOptionType) {
      // In a real app, this would redirect to the platform's OAuth page.
      // window.location.href = `/api/connect/${platform.id}?type=${selectedOptionType}`;
      // For simulation, we call the onConnect prop.
      onConnect(platform.id, selectedOptionType);
    }
  }, [onConnect, platform.id, selectedOptionType]);

  const selectedOptionDetails = platform.connectionOptions.find(opt => opt.type === selectedOptionType);
  const PlatformIcon = platform.icon;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
        <div className="relative w-full max-w-4xl bg-card shadow-xl rounded-2xl transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-appear">
            <div className="flex items-center justify-between p-6 border-b border-lightBorder">
                <div className="flex items-center">
                    <button onClick={onClose} className="text-textSecondary hover:text-primary mr-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <div className="flex items-center">
                        <PlatformIcon className={`w-7 h-7 ${platform.brandColor}`} />
                        <h3 className="text-xl font-bold text-textPrimary ml-3">Which type of {platform.name} account would you like to connect?</h3>
                    </div>
                </div>
                 <button onClick={onClose} className="p-2 -mr-2 text-textSecondary hover:text-primary">
                    <XMarkIcon className="w-6 h-6" />
                 </button>
            </div>
            <div className="p-8">
                 <p className="text-center text-textSecondary mb-8 -mt-2">The account type you choose will determine the features available to you.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {platform.connectionOptions.map(option => (
                        <ConnectionOptionCard 
                            key={option.type}
                            option={option}
                            isSelected={selectedOptionType === option.type}
                            onSelect={() => setSelectedOptionType(option.type)}
                            platformName={platform.name}
                        />
                    ))}
                </div>

                {selectedOptionDetails?.warning && (
                    <div className="mt-6 flex items-start p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400 mr-3 shrink-0 mt-px" />
                        <p className="text-sm text-yellow-300">{selectedOptionDetails.warning}</p>
                    </div>
                )}
            </div>
            <div className="px-8 py-6 bg-gray-900/50 rounded-b-2xl flex justify-end items-center">
                <Button variant="primary" size="lg" onClick={handleConnect} disabled={!selectedOptionType}>
                    Connect to {platform.name}
                </Button>
            </div>
        </div>
    </div>
  );
};
