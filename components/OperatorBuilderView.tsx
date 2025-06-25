
import React, { useState } from 'react';
import { Operator, Persona, RSTProfile, RSTTraitLevel } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson } from '../services/aiService';
import { OPERATOR_TYPES, RST_TRAITS } from '../constants';
import { useToast } from './ui/ToastProvider'; // Import useToast

interface OperatorBuilderViewProps {
  operators: Operator[];
  personas: Persona[];
  onAddOperator: (operator: Operator) => void;
  onUpdateOperator: (operator: Operator) => void;
}

// Helper component for RST Visual Bar
const RstVisualBar: React.FC<{ level: RSTTraitLevel }> = ({ level }) => {
  const levelMap: Record<RSTTraitLevel, { width: string; color: string; label: string }> = {
    'Not Assessed': { width: 'w-1/4', color: 'bg-gray-300', label: 'NA' },
    'Low': { width: 'w-1/2', color: 'bg-green-500', label: 'L' },
    'Medium': { width: 'w-3/4', color: 'bg-yellow-500', label: 'M' },
    'High': { width: 'w-full', color: 'bg-red-500', label: 'H' },
  };
  const currentLevel = levelMap[level] || levelMap['Not Assessed'];
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 my-1" title={level}>
      <div className={`${currentLevel.color} h-2.5 rounded-full ${currentLevel.width}`}></div>
    </div>
  );
};


interface OperatorFormProps {
  initialOperator?: Operator;
  personas: Persona[];
  onSubmit: (operator: Omit<Operator, 'id'>) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  onSuggestOperatorDetails?: (details: { type: Operator['type'], targetAudienceId: string, desiredCR: string }) => Promise<{cs?: string, us?: string, reinforcementLoop?: string} | null>;
}

interface AiOperatorSuggestion {
    cs: string;
    us: string;
    reinforcementLoop: string;
}

const OperatorForm: React.FC<OperatorFormProps> = ({ initialOperator, personas, onSubmit, onCancel, isLoading, onSuggestOperatorDetails }) => {
  const { showToast } = useToast();
  const [name, setName] = useState(initialOperator?.name || '');
  const [targetAudienceId, setTargetAudienceId] = useState(initialOperator?.targetAudienceId || '');
  const [type, setType] = useState<Operator['type']>(initialOperator?.type || 'Custom');
  const [cs, setCs] = useState(initialOperator?.conditionedStimulus || '');
  const [us, setUs] = useState(initialOperator?.unconditionedStimulus || '');
  const [desiredCR, setDesiredCR] = useState(initialOperator?.desiredConditionedResponse || '');
  const [reinforcementLoop, setReinforcementLoop] = useState(initialOperator?.reinforcementLoop || '');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const selectedPersona = personas.find(p => p.id === targetAudienceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAudienceId) {
        showToast("Please select a target audience.", "error");
        return;
    }
    onSubmit({ name, targetAudienceId, type, conditionedStimulus: cs, unconditionedStimulus: us, desiredConditionedResponse: desiredCR, reinforcementLoop });
  };

  const handleSuggestClick = async () => {
    if (!onSuggestOperatorDetails || !targetAudienceId || !type || !desiredCR) {
        showToast("Please select target audience, operator type, and desired response to get suggestions.", "error");
        return;
    }
    setIsSuggesting(true);
    const suggestions = await onSuggestOperatorDetails({ type, targetAudienceId, desiredCR });
    if (suggestions) {
        if(suggestions.cs) setCs(suggestions.cs);
        if(suggestions.us) setUs(suggestions.us);
        if(suggestions.reinforcementLoop) setReinforcementLoop(suggestions.reinforcementLoop);
    } else {
        showToast("AI suggestion failed or returned no data.", "error");
    }
    setIsSuggesting(false);
  };

  const personaOptions = personas.map(p => ({ value: p.id, label: p.name }));
  const operatorTypeOptions = OPERATOR_TYPES.map(t => ({ value: t, label: t }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Operator Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Select label="Target Audience Persona" value={targetAudienceId} onChange={(e) => setTargetAudienceId(e.target.value)} options={personaOptions} required />
      
      {selectedPersona?.rstProfile && (
        <Card title="Selected Persona's RST Profile" className="p-3 bg-indigo-50 border border-indigo-200 text-xs mt-2" shadow="none">
          {RST_TRAITS.map(traitInfo => (
            <div key={traitInfo.key} className="mb-1">
              <span className="font-medium text-indigo-700">{traitInfo.label.split(' (')[0]}: </span>
              <span className="text-indigo-600">{selectedPersona.rstProfile?.[traitInfo.key]}</span>
              <RstVisualBar level={selectedPersona.rstProfile?.[traitInfo.key] || 'Not Assessed'} />
            </div>
          ))}
        </Card>
      )}

      <Select label="Operator Type (e.g., Hope, Fear)" value={type} onChange={(e) => setType(e.target.value as Operator['type'])} options={operatorTypeOptions} required />
      <Textarea label="Desired Conditioned Response (CR)" value={desiredCR} onChange={(e) => setDesiredCR(e.target.value)} placeholder="e.g., Increased support, sharing positive content" required />
      <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-semibold text-blue-700 mb-2">AI Suggestions</h4>
        {onSuggestOperatorDetails && (
            <Button type="button" variant="secondary" size="sm" onClick={handleSuggestClick} isLoading={isSuggesting} disabled={!targetAudienceId || !type || !desiredCR}>
            Suggest CS, US & Reinforcement
            </Button>
        )}
        <p className="text-xs text-gray-500 mt-1">AI can suggest Conditioned Stimulus, Unconditioned Stimulus, and Reinforcement Loop based on selections.</p>
      </div>
      <Textarea label="Conditioned Stimulus (CS)" value={cs} onChange={(e) => setCs(e.target.value)} placeholder="e.g., A specific symbol, phrase, or image type" required />
      <Textarea label="Unconditioned Stimulus (US)" value={us} onChange={(e) => setUs(e.target.value)} placeholder="e.g., Positive news (for Hope); Threat warnings (for Fear)" required />
      <Textarea label="Reinforcement Loop" value={reinforcementLoop} onChange={(e) => setReinforcementLoop(e.target.value)} placeholder="e.g., Social validation, repeated exposure, echo chamber effects" required />
      <div className="flex justify-end space-x-3">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" isLoading={isLoading}>
          {initialOperator ? 'Update Operator' : 'Create Operator'}
        </Button>
      </div>
    </form>
  );
};


export const OperatorBuilderView: React.FC<OperatorBuilderViewProps> = ({ operators, personas, onAddOperator, onUpdateOperator }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Keep setError for other types of errors

  const handleCreateOrUpdateOperator = (operatorData: Omit<Operator, 'id'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const newOrUpdatedOperator: Operator = { ...operatorData, id: editingOperator?.id || Date.now().toString() };
      if (editingOperator) onUpdateOperator(newOrUpdatedOperator);
      else onAddOperator(newOrUpdatedOperator);
      setShowForm(false);
      setEditingOperator(undefined);
    } catch (e) { setError((e as Error).message); } 
    finally { setIsLoading(false); }
  };
  
  const handleSuggestOperatorDetails = async (details: { type: Operator['type'], targetAudienceId: string, desiredCR: string }): Promise<AiOperatorSuggestion | null> => {
    const persona = personas.find(p => p.id === details.targetAudienceId);
    if (!persona) { setError("Target persona not found for suggestion."); return null; }
    // ... (rest of AI suggestion logic remains the same, error handling within it might use setError or throw) ...
    const prompt = `
      Persona Details:
      Name: ${persona.name}
      Demographics: ${persona.demographics}
      Psychographics: ${persona.psychographics}
      Initial Beliefs: ${persona.initialBeliefs}
      Vulnerabilities: ${persona.vulnerabilities?.join(', ') || 'Not specified'}
      RST Profile: BAS: ${persona.rstProfile?.bas || 'N/A'}, BIS: ${persona.rstProfile?.bis || 'N/A'}, FFFS: ${persona.rstProfile?.fffs || 'N/A'}

      Campaign Goal: Operator Type: ${details.type}, Desired Conditioned Response (CR): "${details.desiredCR}"
      Based on these details, suggest a plausible Conditioned Stimulus (CS), an Unconditioned Stimulus (US), and a Reinforcement Loop.
      Return your suggestions as a JSON object with the EXACT keys "cs", "us", and "reinforcementLoop".
    `;
    const systemInstruction = "You are an expert in psychological operations and behavioral marketing. Provide creative, plausible suggestions for conditioning components. Ensure JSON output.";
    const result = await generateJson<AiOperatorSuggestion>(prompt, systemInstruction); 
    if (result.data && result.data.cs && result.data.us && result.data.reinforcementLoop) {
        return { cs: result.data.cs.replace(/\\n/g, '\n'), us: result.data.us.replace(/\\n/g, '\n'), reinforcementLoop: result.data.reinforcementLoop.replace(/\\n/g, '\n')};
    } else {
      setError(result.error || "AI suggestions for operator details failed or returned invalid format.");
      return null;
    }
  };

  const handleEdit = (operator: Operator) => {
    setEditingOperator(operator);
    setShowForm(true);
  };
  
  if (personas.length === 0 && !showForm) {
    return (
      <div className="p-6">
        <Card className="text-center">
            <h2 className="text-2xl font-bold text-textPrimary mb-4">Operator Builder</h2>
            <p className="text-textSecondary text-lg">Please create at least one Persona in 'Audience Modeling' before building an Operator.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-textPrimary">Operator Builder</h2>
        {!showForm && (<Button variant="primary" onClick={() => { setShowForm(true); setEditingOperator(undefined); setError(null); }}>Create New Operator</Button>)}
      </div>
      {error && <Card className="mb-4 bg-red-100 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}
      {showForm ? (
        <Card title={editingOperator ? "Edit Operator" : "Create New Operator"}>
          <OperatorForm initialOperator={editingOperator} personas={personas} onSubmit={handleCreateOrUpdateOperator} onCancel={() => { setShowForm(false); setEditingOperator(undefined); setError(null);}} isLoading={isLoading} onSuggestOperatorDetails={handleSuggestOperatorDetails} />
        </Card>
      ) : (
        <>
          {operators.length === 0 && !isLoading && ( <Card className="text-center"><p className="text-textSecondary text-lg">No operators created yet.</p><p className="text-textSecondary">Click "Create New Operator" to design one.</p></Card>)}
          {isLoading && operators.length === 0 && <LoadingSpinner text="Loading operators..." />}
          <div className="space-y-4">
            {operators.map((op) => {
              const persona = personas.find(p => p.id === op.targetAudienceId);
              return (
                <Card key={op.id} title={`${op.name} (${op.type})`}>
                  <p className="text-sm text-textSecondary mb-1"><strong>Target Audience:</strong> {persona?.name || 'N/A'}</p>
                  <p className="text-sm text-textSecondary mb-1"><strong>CS:</strong> {op.conditionedStimulus}</p>
                  <p className="text-sm text-textSecondary mb-1"><strong>US:</strong> {op.unconditionedStimulus}</p>
                  <p className="text-sm text-textSecondary mb-1"><strong>Desired CR:</strong> {op.desiredConditionedResponse}</p>
                  <p className="text-sm text-textSecondary mb-3"><strong>Reinforcement:</strong> {op.reinforcementLoop}</p>
                  <div className="mt-4 pt-4 border-t border-gray-200"><Button size="sm" variant="ghost" onClick={() => handleEdit(op)}>Edit</Button></div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
