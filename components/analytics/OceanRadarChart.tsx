import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { BrmScores } from '../../types';

interface BrmRadarChartProps {
  scores: BrmScores | null;
  color: string;
  gradientId: string;
}

const BrmRadarChart: React.FC<BrmRadarChartProps> = ({ scores, color, gradientId }) => {
  if (!scores) {
    return null;
  }

  const data = [
    { subject: 'Overconfidence', score: scores.overconfidence, fullMark: 1.0 },
    { subject: 'Frame Exploit', score: scores.frameExploit, fullMark: 1.0 },
    { subject: 'Existing Belief', score: scores.existingBelief, fullMark: 1.0 },
    { subject: 'Following Crowd', score: scores.followingTheCrowd, fullMark: 1.0 },
    { subject: 'Authority', score: scores.appealToAuthority, fullMark: 1.0 },
    { subject: 'Anger', score: scores.anger, fullMark: 1.0 },
    { subject: 'Moralizing', score: scores.moralizing, fullMark: 1.0 },
    { subject: 'Simplification', score: scores.simplification, fullMark: 1.0 },
    { subject: 'Directness', score: scores.directness, fullMark: 1.0 },
    { subject: 'Social Pressure', score: scores.socialPressure, fullMark: 1.0 },
    { subject: 'Self-Affirmation', score: scores.selfAffirmation, fullMark: 1.0 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <defs>
            <radialGradient id={gradientId}>
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.1} />
            </radialGradient>
        </defs>
        <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#f9fafb', fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }} />
        <Radar 
            name="Persona BRM Profile" 
            dataKey="score" 
            stroke={color} 
            fill={`url(#${gradientId})`}
            fillOpacity={0.8} 
            dot={{ r: 4, fill: color, stroke: '#fee2e2' }}
        />
        <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(31, 41, 55, 0.9)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '0.5rem',
              color: '#f9fafb',
            }}
            labelStyle={{ color: '#cbd5e1' }}
            formatter={(value: number) => [value.toFixed(2), 'Score']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default BrmRadarChart;
