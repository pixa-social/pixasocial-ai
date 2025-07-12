import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';
import { OceanScores } from '../../types';

interface OceanRadarChartProps {
  scores: OceanScores | null;
  color: string;
  gradientId: string;
}

const OceanRadarChart: React.FC<OceanRadarChartProps> = ({ scores, color, gradientId }) => {
  if (!scores) {
    return null;
  }

  const data = [
    { subject: 'Creativity', score: scores.creativity, fullMark: 1.0 },
    { subject: 'Organization', score: scores.organization, fullMark: 1.0 },
    { subject: 'Sociability', score: scores.sociability, fullMark: 1.0 },
    { subject: 'Kindness', score: scores.kindness, fullMark: 1.0 },
    { subject: 'Emotional Stability', score: scores.emotionalStability, fullMark: 1.0 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <defs>
            <radialGradient id={gradientId}>
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.1} />
            </radialGradient>
        </defs>
        <PolarGrid stroke="rgba(255, 255, 255, 0.2)" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#f9fafb', fontSize: 14 }} />
        <PolarRadiusAxis angle={30} domain={[0, 1]} tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }} />
        <Radar 
            name="Persona Personality Profile" 
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
        <Legend wrapperStyle={{ color: '#F3F4F6', paddingTop: '20px' }} />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default OceanRadarChart;