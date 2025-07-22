import React, { useState, useCallback, useMemo } from 'react';
import { Operator, Persona, ViewName, AIOperatorEffectivenessAnalysis, RSTProfile } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson } from '../services/aiService';
import { useToast } from './ui/ToastProvider';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, PlusCircleIcon, DocumentDuplicateIcon } from './ui/Icons';
import { OperatorForm } from './operator-builder/OperatorForm';
import { OperatorFlowDiagram } from './operator-builder/OperatorFlowDiagram';
import { EffectivenessGauge } from './operator-builder/EffectivenessGauge';
import { OperatorTemplatesModal } from './operator-builder/OperatorTemplatesModal';
import { useAppDataContext } from './MainAppLayout';
import { VIEW_PATH_MAP } from '../constants';

const OperatorCard: React.FC<{ operator: Operator, personaName: string, onSelect: () => void, isActive: boolean }> = ({ operator, personaName, onSelect, isActive }) => {
    const score = operator.effectiveness_score;
    const scoreColor = score === null || score === undefined ? 'text-muted-foreground' : score > 75 ? 'text-success' : score > 50 ? 'text-yellow-400' : 'text-destructive';
    return (
        <button onClick={onSelect} className={`w-full text-left p-3 rounded-lg transition-colors ${isActive ? 'bg-primary/20' : 'hover:bg-card'}`}>
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-semibold text-foreground truncate">{operator.name}</p>
                    <p className="text-xs text-muted-foreground">Target: {personaName}</p>
                </div>
                {score !== null && score !== undefined && ( <div className="flex flex-col items-center"><span className={`text-xl font-bold ${scoreColor}`}>{score}</span><span className="text-xxs text-muted-foreground -mt-1">Score</span></div> )}
            </div>
        </button>
    );
};

export const OperatorBuilderView: React.FC = () => {
  const { currentUser, personas, operators, handlers } = useAppDataContext();
  const { addOperator: onAddOperator, updateOperator: onUpdateOperator, deleteOperator: onDeleteOperator } = handlers;
  const navigate = useNavigate();
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  const sortedOperators = useMemo(() => operators.slice().sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()), [operators]);

  const handleSelectOperator = useCallback((operator: Operator) => {
    setSelectedOperator(operator); setIsCreatingNew(false);
  }, []);

  const handleCreateNew = useCallback(() => {
    setSelectedOperator(null); setIsCreatingNew(true);
  }, []);
  
  const handleCancel = useCallback(() => {
    setSelectedOperator(null); setIsCreatingNew(false);
  }, []);

  const handleDelete = useCallback(async (operatorId: number) => {
    if (window.confirm("Are you sure? This will permanently delete this operator.")) {
      await onDeleteOperator(operatorId);
      if (selectedOperator?.id === operatorId) handleCancel();
    }
  }, [onDeleteOperator, selectedOperator, handleCancel]);

  const handleApplyTemplate = (templateData: Partial<Omit<Operator, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'target_audience_id'>>) => {
      handleCreateNew();
      setSelectedOperator(templateData as Operator);
      setIsTemplatesModalOpen(false);
  };
  
  const handleAnalyzeOperator = useCallback(async (operatorData: Operator, persona: Persona) => {
      setIsLoading(true);
      const rstProfile = persona.rst_profile as unknown as RSTProfile | null;
      const prompt = `Analyze the effectiveness of a psychological operator on a target persona. Persona Details: - RST Profile: BAS: ${rstProfile?.bas}, BIS: ${rstProfile?.bis}, FFFS: ${rstProfile?.fffs}, Demographics: ${persona.demographics}, Psychographics: ${persona.psychographics}. Operator Details: - Type: ${operatorData.type}, Desired Response: ${operatorData.desired_conditioned_response}, Conditioned Stimulus: ${operatorData.conditioned_stimulus}, Unconditioned Stimulus: ${operatorData.unconditioned_stimulus}, Reinforcement Loop: ${operatorData.reinforcement_loop}. Provide a JSON response with: 1. "effectivenessScore": An integer score from 0 to 100. 2. "alignmentAnalysis": A concise paragraph explaining how well the operator type and stimuli align with the persona's RST profile and psychology. 3. "improvementSuggestions": An array of 2-3 actionable, concrete suggestions to strengthen the operator's impact.`;
      const systemInstruction = "You are a behavioral psychology expert. Analyze the operator-persona fit and provide a structured JSON response with a score, analysis, and suggestions.";
      const result = await generateJson<AIOperatorEffectivenessAnalysis>(prompt, currentUser, systemInstruction);
      if (result.data) {
          const analysisData = { effectiveness_score: result.data.effectivenessScore, alignment_analysis: result.data.alignmentAnalysis, improvement_suggestions: result.data.improvementSuggestions };
          await onUpdateOperator(operatorData.id, analysisData);
          setSelectedOperator(prev => prev ? { ...prev, ...analysisData } : null);
          showToast("Effectiveness analysis complete!", "success");
      } else { showToast(result.error || "Analysis failed.", "error"); }
      setIsLoading(false);
  }, [currentUser, onUpdateOperator, showToast]);

  return (
    <div className="p-4 md:p-6">
      {isTemplatesModalOpen && <OperatorTemplatesModal isOpen={isTemplatesModalOpen} onClose={() => setIsTemplatesModalOpen(false)} onSelect={handleApplyTemplate} />}
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Operator Builder</h2>
      {personas.length === 0 && ( <PrerequisiteMessageCard title="Prerequisite Missing" message="Please create at least one Persona before building an Operator." action={{ label: 'Go to Audience Modeling', onClick: () => navigate(VIEW_PATH_MAP[ViewName.AudienceModeling]) }} /> )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card title="Your Operators">
            <div className="space-y-2">
              <Button onClick={handleCreateNew} variant="primary" className="w-full mb-2" leftIcon={<PlusCircleIcon className="w-4 h-4" />} disabled={personas.length === 0}>Create New Operator</Button>
              <Button onClick={() => setIsTemplatesModalOpen(true)} variant="secondary" className="w-full" leftIcon={<DocumentDuplicateIcon className="w-4 h-4" />} disabled={personas.length === 0}>Use a Template</Button>
            </div>
            <div className="mt-4 pt-4 border-t border-border space-y-1 max-h-96 overflow-y-auto">
              {sortedOperators.map(op => <OperatorCard key={op.id} operator={op} personaName={personas.find(p => p.id === op.target_audience_id)?.name || "N/A"} onSelect={() => handleSelectOperator(op)} isActive={selectedOperator?.id === op.id} />)}
              {operators.length === 0 && personas.length > 0 && <p className="text-sm text-center text-muted-foreground py-4">No operators created yet.</p>}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2">
          {!selectedOperator && !isCreatingNew && ( <Card className="flex items-center justify-center h-full min-h-[400px] text-center"><p className="text-muted-foreground">Select an operator to view its details, or create a new one.</p></Card> )}
          {(selectedOperator || isCreatingNew) && (
            <div className="space-y-6">
              <Card title={isCreatingNew && !selectedOperator?.name ? "Create New Operator" : (selectedOperator?.name || "Edit Operator")}>
                <OperatorForm key={selectedOperator?.id || 'new'} initialOperator={selectedOperator || undefined} personas={personas} onAddOperator={onAddOperator} onUpdateOperator={onUpdateOperator} onCancel={handleCancel} onDelete={handleDelete} onAnalyze={handleAnalyzeOperator} currentUser={currentUser} />
              </Card>
              <Card title="Operator Flow Diagram"><OperatorFlowDiagram operator={selectedOperator} persona={personas.find(p => p.id === selectedOperator?.target_audience_id)} /></Card>
              {selectedOperator?.id && (
                  <Card title="Effectiveness Analysis">
                      {isLoading && <LoadingSpinner text="Analyzing..." />}
                      {!isLoading && selectedOperator.effectiveness_score !== null && selectedOperator.effectiveness_score !== undefined ? (
                          <div className="space-y-4">
                              <div className="flex flex-col md:flex-row items-center gap-6"><EffectivenessGauge score={selectedOperator.effectiveness_score} /><div className="flex-1"><h4 className="font-semibold text-foreground mb-1">Alignment Analysis</h4><p className="text-sm text-muted-foreground">{selectedOperator.alignment_analysis}</p></div></div>
                              <div><h4 className="font-semibold text-foreground mb-2">Improvement Suggestions</h4><ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">{(selectedOperator.improvement_suggestions || []).map((s, i) => <li key={i}>{s}</li>)}</ul></div>
                          </div>
                      ) : ( <p className="text-muted-foreground text-center py-4">No analysis performed yet. Complete and save the operator, then click "Analyze Operator".</p> )}
                  </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
