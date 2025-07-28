import React, { useState, useCallback, useMemo } from 'react';
import { Operator, Persona, ViewName, AIOperatorEffectivenessAnalysis, RSTProfile } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson } from '../services/aiService';
import { useToast } from './ui/ToastProvider';
import { EmptyState } from './ui/EmptyState';
import { useNavigate } from 'react-router-dom';
import { TrashIcon, PlusCircleIcon, DocumentDuplicateIcon, UsersIcon } from './ui/Icons';
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
  const { currentUser, personas, operators, handlers, onNavigate } = useAppDataContext();
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
      const prompt = `Analyze the effectiveness of a psychological operator on a target persona. Persona Details: - RST Profile: BAS: ${rstProfile?.bas}, BIS: ${rstProfile?.bis}, FFFS: ${rstProfile?.fffs}, Demographics: ${persona.demographics}, Psychographics: ${persona.psychographics}. Operator Details: - Type: ${operatorData.type}, Desired Response: ${operatorData.desired_conditioned_response}, Conditioned Stimulus: ${operatorData.conditioned_stimulus}, Unconditioned Stimulus: ${operatorData.unconditioned_stimulus}. Provide a JSON response with three keys: "effectivenessScore" (a number 0-100), "alignmentAnalysis" (a string explaining the score), and "improvementSuggestions" (an array of strings).`;
      
      const result = await generateJson<AIOperatorEffectivenessAnalysis>(prompt, currentUser);
      
      if (result.data) {
          const { effectivenessScore, alignmentAnalysis, improvementSuggestions } = result.data;
          await onUpdateOperator(operatorData.id, {
              effectiveness_score: effectivenessScore,
              alignment_analysis: alignmentAnalysis,
              improvement_suggestions: improvementSuggestions,
          });
          showToast("Effectiveness analysis complete!", "success");
      } else {
          showToast(result.error || "Failed to analyze operator.", "error");
      }
      setIsLoading(false);
  }, [currentUser, onUpdateOperator, showToast]);

    const selectedPersonaForDiagram = useMemo(() => {
        const op = selectedOperator || (isCreatingNew ? null : sortedOperators[0]);
        if (!op) return undefined;
        return personas.find(p => p.id === op.target_audience_id);
    }, [selectedOperator, isCreatingNew, sortedOperators, personas]);

    if (personas.length === 0) {
        return (
          <div className="p-6">
            <EmptyState
              icon={<UsersIcon className="w-8 h-8 text-primary" />}
              title="Create a Persona to Begin"
              description="Operators need a target audience. Please create at least one persona in the 'Audience Modeling' section before building an operator."
              action={{ label: 'Go to Audience Modeling', onClick: () => navigate(VIEW_PATH_MAP[ViewName.AudienceModeling]) }}
            />
          </div>
        );
    }
    
    const currentOperator = selectedOperator || (!isCreatingNew && sortedOperators.length > 0 ? sortedOperators[0] : null);

    return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
            <Card title="Operators">
                <div className="flex gap-2 mb-4">
                    <Button onClick={handleCreateNew} size="sm" className="flex-1" leftIcon={<PlusCircleIcon className="w-4 h-4" />}>New Operator</Button>
                    <Button onClick={() => setIsTemplatesModalOpen(true)} size="sm" variant="secondary" className="flex-1" leftIcon={<DocumentDuplicateIcon className="w-4 h-4" />}>Templates</Button>
                </div>
                <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
                    {sortedOperators.map(op => {
                    const personaName = personas.find(p => p.id === op.target_audience_id)?.name || 'N/A';
                    return <OperatorCard key={op.id} operator={op} personaName={personaName} onSelect={() => handleSelectOperator(op)} isActive={selectedOperator?.id === op.id} />
                    })}
                </div>
            </Card>
            {isLoading && (
                <Card><LoadingSpinner text="Analyzing..." /></Card>
            )}
            {currentOperator && currentOperator.effectiveness_score !== null && (
                <Card title="Effectiveness Analysis">
                    <div className="flex flex-col items-center text-center">
                        <EffectivenessGauge score={currentOperator.effectiveness_score || 0} />
                        <p className="text-sm text-muted-foreground mt-4">{currentOperator.alignment_analysis}</p>
                        {currentOperator.improvement_suggestions && currentOperator.improvement_suggestions.length > 0 && (
                            <div className="mt-4 text-left w-full">
                            <h5 className="font-semibold text-sm text-foreground">Suggestions:</h5>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 mt-1">
                                {currentOperator.improvement_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
        <div className="lg:col-span-2">
            {isCreatingNew || selectedOperator ? (
                <Card title={isCreatingNew ? "Create New Operator" : "Edit Operator"}>
                    <OperatorForm
                        key={selectedOperator?.id || 'new'}
                        initialOperator={selectedOperator || undefined}
                        personas={personas}
                        currentUser={currentUser}
                        onAddOperator={onAddOperator}
                        onUpdateOperator={onUpdateOperator}
                        onDelete={handleDelete}
                        onCancel={handleCancel}
                        onAnalyze={handleAnalyzeOperator}
                    />
                </Card>
            ) : (
                <Card>
                    <div className="text-center py-12">
                        <h3 className="text-xl font-semibold text-foreground">Select an Operator</h3>
                        <p className="text-muted-foreground mt-2">Select an operator from the list to view or edit its details, or create a new one.</p>
                    </div>
                </Card>
            )}
            {(isCreatingNew || selectedOperator) && (
                <Card title="Operator Flow Diagram" className="mt-6">
                    <OperatorFlowDiagram operator={selectedOperator} persona={selectedPersonaForDiagram} />
                </Card>
            )}
        </div>
        {isTemplatesModalOpen && <OperatorTemplatesModal isOpen={isTemplatesModalOpen} onClose={() => setIsTemplatesModalOpen(false)} onSelect={handleApplyTemplate} />}
    </div>
    );
};