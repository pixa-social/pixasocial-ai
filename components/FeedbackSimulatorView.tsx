import React, { useState, useCallback, useMemo } from 'react';
import { Persona, Operator, FeedbackSimulationResult, ContentDraft, ViewName } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson } from '../services/aiService'; // Expecting JSON response
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard'; // Added import
import { useNavigateToView } from '../hooks/useNavigateToView'; // Assuming a custom hook for navigation or pass onNavigate


const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Positive, Neutral, Negative

interface FeedbackSimulatorViewProps {
  personas: Persona[];
  operators: Operator[];
  contentDrafts: ContentDraft[];
  onNavigate?: (view: ViewName) => void; // Optional navigation prop
}

const getDraftPreviewContent = (draft: ContentDraft): string => {
  for (const key in draft.platformContents) {
    if (draft.platformContents[key]?.content) {
      const content = draft.platformContents[key].content;
      return content.substring(0, 30) + (content.length > 30 ? '...' : '');
    }
  }
  return 'No content preview';
};

export const FeedbackSimulatorView: React.FC<FeedbackSimulatorViewProps> = ({ personas, operators, contentDrafts, onNavigate }) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [contentToSimulate, setContentToSimulate] = useState<string>('');
  const [simulationResult, setSimulationResult] = useState<FeedbackSimulationResult | null>(null);
  const navigateTo = useNavigateToView(onNavigate);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const personaOptions = useMemo(() => personas.map(p => ({ value: p.id, label: p.name })), [personas]);
  
  const contentDraftOptions = useMemo(() => contentDrafts.map(d => ({
    value: d.id,
    label: `Draft for ${personas.find(p=>p.id === d.personaId)?.name || 'N/A'} (Op: ${operators.find(o=>o.id === d.operatorId)?.name || 'N/A'}) - ${getDraftPreviewContent(d)}`
  })), [contentDrafts, personas, operators]);

  const handleSelectDraft = useCallback((draftId: string) => {
    const draft = contentDrafts.find(d => d.id === draftId);
    if (draft) {
      let firstContent = '';
      for (const platformKey in draft.platformContents) {
        if (draft.platformContents[platformKey]?.content) {
          firstContent = draft.platformContents[platformKey].content;
          break; // Use the first available content
        }
      }
      setContentToSimulate(firstContent);
      setSelectedPersonaId(draft.personaId); // Auto-select persona from draft
    }
  }, [contentDrafts]);

  const handleSimulateFeedback = useCallback(async () => {
    if (!selectedPersonaId || !contentToSimulate) {
      setError("Please select a Persona and provide content to simulate.");
      return;
    }
    const persona = personas.find(p => p.id === selectedPersonaId);
    if (!persona) {
      setError("Selected Persona not found.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSimulationResult(null);

    const prompt = `
      Persona Profile:
      Name: ${persona.name}
      Demographics: ${persona.demographics}
      Psychographics: ${persona.psychographics}
      Initial Beliefs: ${persona.initialBeliefs}
      Vulnerabilities: ${persona.vulnerabilities?.join(', ') || 'Not specified'}

      Content for Feedback Simulation:
      """
      ${contentToSimulate}
      """

      Based on the persona and the provided content, simulate the likely feedback.
      Provide your simulation as a JSON object with the following structure:
      {
        "sentiment": {
          "positive": <percentage_0_to_100>,
          "neutral": <percentage_0_to_100>,
          "negative": <percentage_0_to_100> 
        },
        "engagementForecast": "<Low|Medium|High>",
        "potentialRisks": ["<risk_1>", "<risk_2>", ...] 
      }
      Ensure percentages sum to 100. Be realistic.
    `;
    
    const result = await generateJson<FeedbackSimulationResult>(
      prompt,
      "You are an AI specializing in predicting audience reactions and sentiment analysis."
    );

    if (result.data) {
      // Validate percentages sum to roughly 100
      const { positive, neutral, negative } = result.data.sentiment;
      if (Math.abs(positive + neutral + negative - 100) > 5) { // Allow small deviation
          setError("AI returned sentiment percentages that do not sum to 100. Please try again or adjust content.");
      } else {
        setSimulationResult(result.data);
      }
    } else {
      setError(result.error || "Failed to simulate feedback.");
    }
    setIsLoading(false);
  }, [selectedPersonaId, contentToSimulate, personas]);
  
  const showPrerequisiteMessage = personas.length === 0;

  const sentimentChartData = simulationResult ? [
    { name: 'Positive', value: simulationResult.sentiment.positive },
    { name: 'Neutral', value: simulationResult.sentiment.neutral },
    { name: 'Negative', value: simulationResult.sentiment.negative },
  ] : [];

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Feedback Simulator</h2>
      
      {showPrerequisiteMessage && (
        <PrerequisiteMessageCard
          title="Prerequisite Missing"
          message="Please create at least one Persona in 'Audience Modeling' before simulating feedback. The 'Target Persona' dropdown will populate once personas are available."
          action={onNavigate ? { label: 'Go to Audience Modeling', onClick: () => navigateTo(ViewName.AudienceModeling) } : undefined }
        />
      )}
      {error && <Card className="mb-4 bg-red-100 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Input for Simulation">
          <Select label="Target Persona" options={personaOptions} value={selectedPersonaId} onChange={e => setSelectedPersonaId(e.target.value)} required disabled={showPrerequisiteMessage} />
          {contentDrafts.length > 0 && (
            <Select 
              label="Or Select a Saved Draft" 
              options={[{value: "", label: "Select a draft..."}, ...contentDraftOptions]} 
              onChange={e => { if(e.target.value) handleSelectDraft(e.target.value); }}
              disabled={showPrerequisiteMessage}
            />
          )}
          <Textarea 
            label="Content to Simulate" 
            value={contentToSimulate} 
            onChange={e => setContentToSimulate(e.target.value)}
            placeholder="Paste or type content here..."
            rows={10}
            required 
            disabled={showPrerequisiteMessage}
          />
          <Button 
            variant="primary" 
            onClick={handleSimulateFeedback} 
            isLoading={isLoading}
            className="w-full mt-4"
            disabled={!selectedPersonaId || !contentToSimulate || isLoading || showPrerequisiteMessage}
          >
            {isLoading ? 'Simulating...' : 'Simulate Feedback'}
          </Button>
        </Card>

        <Card title="Simulation Results">
          {isLoading && <LoadingSpinner text="AI is forecasting feedback..." />}
          {!isLoading && !simulationResult && !error && <p className="text-textSecondary">Results will appear here after simulation.</p>}
          {simulationResult && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-textPrimary">Sentiment Distribution:</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={sentimentChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {sentimentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="font-semibold text-textPrimary">Engagement Forecast:</h4>
                <p className={`text-lg font-medium ${
                  simulationResult.engagementForecast === 'High' ? 'text-accent' :
                  simulationResult.engagementForecast === 'Medium' ? 'text-yellow-500' : 'text-danger'
                }`}>
                  {simulationResult.engagementForecast}
                </p>
              </div>
              {simulationResult.potentialRisks && simulationResult.potentialRisks.length > 0 && (
                <div>
                  <h4 className="font-semibold text-textPrimary">Potential Risks:</h4>
                  <ul className="list-disc list-inside text-sm text-danger space-y-1">
                    {simulationResult.potentialRisks.map((risk, idx) => <li key={idx}>{risk}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
