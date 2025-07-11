
import React from 'react';
import { RSTTraitLevel } from '../../types';

export const RstVisualBar: React.FC<{ level: RSTTraitLevel }> = ({ level }) => {
  const levelMap: Record<RSTTraitLevel, { width: string; color: string; label: string }> = {
    'Not Assessed': { width: 'w-[25%]', color: 'bg-gray-500', label: 'NA' },
    'Low':          { width: 'w-[50%]', color: 'bg-green-500', label: 'L' },
    'Medium':       { width: 'w-[75%]', color: 'bg-yellow-500', label: 'M' },
    'High':         { width: 'w-[100%]', color: 'bg-red-500', label: 'H' },
  };
  const currentLevel = levelMap[level] || levelMap['Not Assessed'];
  return (
    <div className="w-full bg-gray-700 rounded-full h-2.5 my-1" title={level}>
      <div className={`${currentLevel.color} h-2.5 rounded-full ${currentLevel.width}`}></div>
    </div>
  );
};

export default RstVisualBar;