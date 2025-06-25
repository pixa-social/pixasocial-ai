
import React, { useState, useCallback } from 'react';
import { AuditStep } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson } from '../services/aiService';
import { AUDIT_TOOL_STEPS_DATA } from '../constants';

interface AuditToolViewProps {
  // Potentially pass campaign data if audit is related to a specific campaign
}

// Helper to trigger file download
const downloadFile = (filename: string, content: string, mimeType: string) => {
  const element = document.createElement('a');
  const file = new Blob([content], { type: mimeType });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element); // Required for this to work in FireFox
  element.click();
  document.body.removeChild(element);
};

export const AuditToolView: React.FC<AuditToolViewProps> = () => {
  const initialSteps: AuditStep[] = AUDIT_TOOL_STEPS_DATA.map(s_item => ({
    id: s_item.id,
    title: s_item.title,
    description: s_item.description,
    content: '', // Content will be filled by AI
    isCompleted: false, // Will be true if AI successfully generates content for it
  }));

  const [steps, setSteps] = useState<AuditStep[]>(initialSteps);
  const [campaignObjective, setCampaignObjective] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlanGenerated, setIsPlanGenerated] = useState(false);

  const handleGenerateFullAuditPlan = useCallback(async () => {
    if (!campaignObjective.trim()) {
      setError("Please provide a campaign objective or problem statement.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setIsPlanGenerated(false); // Reset plan generated state

    // Construct the definitions part of the prompt
    const stepDefinitions = AUDIT_TOOL_STEPS_DATA.map(s => `${s.id}: ${s.title} - ${s.description}`).join("\n");

    const prompt = `
      Campaign Objective / Problem Statement:
      "${campaignObjective}"

      Based on the above campaign objective/problem statement, generate a comprehensive 8D audit plan.
      For each of the 8 Disciplines (D0-D8) detailed below, provide practical and actionable content.
      The content should directly relate to the provided campaign objective.

      8D Step Definitions:
      ${stepDefinitions}

      Return your response as a single JSON object. The keys of this object should be the step IDs (e.g., "D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8").
      The value for each key should be a string containing the detailed content for that specific 8D step.
      Ensure the content is thorough and directly addresses the campaign objective in the context of each 8D step.
      Example of expected JSON structure:
      {
        "D0": "Detailed content for D0: Plan...",
        "D1": "Detailed content for D1: Establish the Team...",
        ...
        "D8": "Detailed content for D8: Congratulate the Team..."
      }
    `;

    const systemInstruction = "You are an AI assistant specialized in strategic planning and project management, proficient in the 8D problem-solving methodology. Generate detailed and practical content for each 8D step based on the user's campaign objective.";
    
    // Type for the expected AI response
    type AiAuditPlanResponse = Record<string, string>;

    const result = await generateJson<AiAuditPlanResponse>(prompt, systemInstruction);

    if (result.data) {
      const allStepsContentProvided = AUDIT_TOOL_STEPS_DATA.every(s_item => result.data![s_item.id] && typeof result.data![s_item.id] === 'string');
      
      if (allStepsContentProvided) {
        setSteps(prevSteps =>
          prevSteps.map(step => ({
            ...step,
            content: result.data![step.id] || "AI did not provide content for this step.",
            isCompleted: !!result.data![step.id], // Mark as completed if AI provided content
          }))
        );
        setIsPlanGenerated(true);
      } else {
         setError("AI response was incomplete or not in the expected format. Some 8D steps might be missing content. Please try again.");
         // Partially update if needed, or reset
          setSteps(initialSteps); // Reset to avoid partial display
      }
    } else {
      setError(result.error || "Failed to generate AI audit plan. The AI might not have returned data or an error occurred.");
      setSteps(initialSteps); // Reset to initial state on error
    }
    setIsLoading(false);
  }, [campaignObjective, initialSteps]);


  const exportAuditPlan = (format: 'markdown' | 'text') => {
    if (!isPlanGenerated) {
      alert("Please generate the audit plan first.");
      return;
    }

    let fileContent = `# 8D Audit Plan\n\n## Campaign Objective:\n${campaignObjective}\n\n`;
    const fileExtension = format === 'markdown' ? 'md' : 'txt';

    steps.forEach(step => {
      if (format === 'markdown') {
        fileContent += `## ${step.id}: ${step.title}\n`;
        fileContent += `**Description:** ${step.description}\n\n`;
        fileContent += `**AI Generated Content:**\n${step.content || 'No content generated.'}\n\n`;
      } else {
        fileContent += `${step.id}: ${step.title}\n`;
        fileContent += `Description: ${step.description}\n`;
        fileContent += `AI Generated Content:\n${step.content || 'No content generated.'}\n\n-----------------\n\n`;
      }
    });

    downloadFile(`8D_Audit_Plan.${fileExtension}`, fileContent, format === 'markdown' ? 'text/markdown' : 'text/plain');
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Automated 8D Audit Tool</h2>
      
      <Card className="mb-6">
        <Textarea
          label="Overall Campaign Objective / Problem Statement"
          value={campaignObjective}
          onChange={(e) => setCampaignObjective(e.target.value)}
          placeholder="e.g., To increase positive public perception of Project X by 20% within 6 months by addressing common misconceptions about its environmental impact."
          rows={4}
          containerClassName="mb-0"
        />
        <Button 
          variant="primary" 
          onClick={handleGenerateFullAuditPlan} 
          isLoading={isLoading}
          className="w-full mt-4"
          disabled={isLoading || !campaignObjective.trim()}
        >
          {isLoading ? 'AI Generating Full 8D Plan...' : 'Generate Full 8D Audit Plan with AI'}
        </Button>
      </Card>

      {error && <Card className="mb-4 bg-red-100 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}
      
      {isLoading && !isPlanGenerated && <LoadingSpinner text="AI is crafting your 8D Audit Plan..." className="my-8" />}

      {isPlanGenerated && !error && (
        <Card title="AI-Generated 8D Audit Plan">
          <div className="flex justify-end space-x-2 mb-4">
            <Button size="sm" variant="secondary" onClick={() => exportAuditPlan('markdown')}>Export as Markdown</Button>
            <Button size="sm" variant="secondary" onClick={() => exportAuditPlan('text')}>Export as Text</Button>
          </div>
          <div className="space-y-6">
            {steps.map(step => (
              <div key={step.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold text-primary">{step.id}: {step.title}</h3>
                <p className="text-sm text-textSecondary mt-1 italic">{step.description}</p>
                <div className="mt-3 p-3 bg-white rounded border border-gray-300">
                  <h4 className="text-sm font-semibold text-textPrimary mb-1">AI Generated Content:</h4>
                  <pre className="whitespace-pre-wrap text-sm text-textPrimary font-sans">
                    {step.content || "No content generated for this step."}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!isLoading && !isPlanGenerated && !error && (
        <Card className="text-center py-8">
            <p className="text-textSecondary text-lg">Enter your campaign objective above and click "Generate" for the AI to create a full 8D audit plan.</p>
        </Card>
      )}
    </div>
  );
};
