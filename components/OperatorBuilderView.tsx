import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Operator, Persona, RSTProfile, RSTTraitLevel, ViewName } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson } from '../services/aiService';
import { OPERATOR_TYPES, RST_TRAITS } from '../constants';
import { useToast } from './ui/ToastProvider'; 
import RstVisualBar from './audience-modeling/RstVisualBar'; 
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard';
import { useNavigateToView } from '../hooks/useNavigateToView';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface OperatorBuilderViewProps {
  operators: Operator[];
  personas: Persona[];
  onAddOperator: (operator: Operator) => void;
  onUpdateOperator: (operator: Operator) => void;
  onNavigate?: (view: ViewName) => void;
}

const operatorFormSchema = z.object({
  name: z.string().min(1, "Operator name is required"),
  targetAudienceId: z.string().min(1, "Target audience is required"),
  type: z.enum(OPERATOR_TYPES as [Operator['type'], ...Operator['type'][]], { // Type assertion for zod
    errorMap: () => ({ message: "Operator type is required" })
  }),
  desiredConditionedResponse: z.string().min(1, "Desired conditioned response is required"),
  conditionedStimulus: z.string().min(1, "Conditioned stimulus is required"),
  unconditionedStimulus: z.string().min(1, "Unconditioned stimulus is required"),
  reinforcementLoop: z.string().min(1, "Reinforcement loop is required"),
});

type OperatorFormData = z.infer<typeof operatorFormSchema>;

interface OperatorFormProps {
  initialOperator?: Operator;
  personas: Persona[];
  onSubmitForm: (operator: OperatorFormData) => void; // Changed from Omit<Operator, 'id'> to OperatorFormData
  onCancel?: () => void;
  isLoading?: boolean;
  onSuggestOperatorDetails?: (details: { type: Operator['type'], targetAudienceId: string, desiredCR: string }) => Promise<{cs?: string, us?: string, reinforcementLoop?: string} | null>;
}

interface AiOperatorSuggestion {
    cs: string;
    us: string;
    reinforcementLoop: string;
}

const OperatorFormComponent: React.FC<OperatorFormProps> = ({ initialOperator, personas, onSubmitForm, onCancel, isLoading, onSuggestOperatorDetails }) => {
  const { showToast } = useToast();
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OperatorFormData>({
    resolver: zodResolver(operatorFormSchema),
    defaultValues: {
      name: initialOperator?.name || '',
      targetAudienceId: initialOperator?.targetAudienceId || '',
      type: initialOperator?.type || 'Custom',
      conditionedStimulus: initialOperator?.conditionedStimulus || '',
      unconditionedStimulus: initialOperator?.unconditionedStimulus || '',
      desiredConditionedResponse: initialOperator?.desiredConditionedResponse || '',
      reinforcementLoop: initialOperator?.reinforcementLoop || '',
    }
  });
  
  const [isSuggesting, setIsSuggesting] = useState(false);
  const watchTargetAudienceId = watch("targetAudienceId");
  const watchType = watch("type");
  const watchDesiredCR = watch("desiredConditionedResponse");

  const selectedPersona = useMemo(() => personas.find(p => p.id === watchTargetAudienceId), [personas, watchTargetAudienceId]);

  const handleSuggestClick = useCallback(async () => {
    if (!onSuggestOperatorDetails || !watchTargetAudienceId || !watchType || !watchDesiredCR) {
        showToast("Please select target audience, operator type, and desired response to get suggestions.", "error");
        return;
    }
    setIsSuggesting(true);
    const suggestions = await onSuggestOperatorDetails({ type: watchType, targetAudienceId: watchTargetAudienceId, desiredCR: watchDesiredCR });
    if (suggestions) {
        if(suggestions.cs) setValue("conditionedStimulus", suggestions.cs);
        if(suggestions.us) setValue("unconditionedStimulus", suggestions.us);
        if(suggestions.reinforcementLoop) setValue("reinforcementLoop", suggestions.reinforcementLoop);
        showToast("AI suggestions populated!", "success");
    } else {
        showToast("AI suggestion failed or returned no data.", "error");
    }
    setIsSuggesting(false);
  }, [onSuggestOperatorDetails, watchTargetAudienceId, watchType, watchDesiredCR, showToast, setValue]);

  const personaOptions = useMemo(() => personas.map(p => ({ value: p.id, label: p.name })), [personas]);
  const operatorTypeOptions = useMemo(() => OPERATOR_TYPES.map(t => ({ value: t, label: t })), []);

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <Input label="Operator Name" {...register("name")} error={errors.name?.message} aria-invalid={!!errors.name} required />
      <Controller
        name="targetAudienceId"
        control={control}
        render={({ field }) => (
          <Select label="Target Audience Persona" {...field} options={personaOptions} error={errors.targetAudienceId?.message} aria-invalid={!!errors.targetAudienceId} required disabled={personas.length === 0} />
        )}
      />
      
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

      <Controller
        name="type"
        control={control}
        render={({ field }) => (
          <Select label="Operator Type (e.g., Hope, Fear)" {...field} options={operatorTypeOptions} error={errors.type?.message} aria-invalid={!!errors.type} required />
        )}
      />
      <Textarea label="Desired Conditioned Response (CR)" {...register("desiredConditionedResponse")} error={errors.desiredConditionedResponse?.message} aria-invalid={!!errors.desiredConditionedResponse} placeholder="e.g., Increased support, sharing positive content" required />
      
      <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="font-semibold text-blue-700 mb-2">AI Suggestions</h4>
        {onSuggestOperatorDetails && (
            <Button type="button" variant="secondary" size="sm" onClick={handleSuggestClick} isLoading={isSuggesting} disabled={!watchTargetAudienceId || !watchType || !watchDesiredCR || isSuggesting}>
            Suggest CS, US & Reinforcement
            </Button>
        )}
        <p className="text-xs text-gray-500 mt-1">AI can suggest Conditioned Stimulus, Unconditioned Stimulus, and Reinforcement Loop based on selections.</p>
      </div>
      
      <Textarea label="Conditioned Stimulus (CS)" {...register("conditionedStimulus")} error={errors.conditionedStimulus?.message} aria-invalid={!!errors.conditionedStimulus} placeholder="e.g., A specific symbol, phrase, or image type" required />
      <Textarea label="Unconditioned Stimulus (US)" {...register("unconditionedStimulus")} error={errors.unconditionedStimulus?.message} aria-invalid={!!errors.unconditionedStimulus} placeholder="e.g., Positive news (for Hope); Threat warnings (for Fear)" required />
      <Textarea label="Reinforcement Loop" {...register("reinforcementLoop")} error={errors.reinforcementLoop?.message} aria-invalid={!!errors.reinforcementLoop} placeholder="e.g., Social validation, repeated exposure, echo chamber effects" required />
      
      <div className="flex justify-end space-x-3">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading || personas.length === 0}>
          {initialOperator ? 'Update Operator' : 'Create Operator'}
        </Button>
      </div>
    </form>
  );
};
const OperatorForm = React.memo(OperatorFormComponent);


export const OperatorBuilderView: React.FC<OperatorBuilderViewProps> = ({ operators, personas, onAddOperator, onUpdateOperator, onNavigate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); 
  const navigateTo = useNavigateToView(onNavigate);

  const handleFormSubmit = useCallback((operatorData: OperatorFormData) => {
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
  }, [editingOperator, onAddOperator, onUpdateOperator]);
  
  const handleSuggestOperatorDetails = useCallback(async (details: { type: Operator['type'], targetAudienceId: string, desiredCR: string }): Promise<AiOperatorSuggestion | null> => {
    const persona = personas.find(p => p.id === details.targetAudienceId);
    if (!persona) { setError("Target persona not found for suggestion."); return null; }

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
        return { cs: result.data.cs.replace(/\\n/g, '\\n'), us: result.data.us.replace(/\\n/g, '\\n'), reinforcementLoop: result.data.reinforcementLoop.replace(/\\n/g, '\\n')};
    } else {
      setError(result.error || "AI suggestions for operator details failed or returned invalid format.");
      return null;
    }
  }, [personas]);

  const handleEdit = useCallback((operator: Operator) => {
    setEditingOperator(operator);
    setShowForm(true);
    setError(null);
  }, []);
  
  return (
    <div className="p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-textPrimary mb-2">Operator Builder</h2>
        <p className="text-textSecondary mb-4">
            Craft powerful operators to influence and engage your audience with precision.
        </p>
        <img 
          src="/assets/operator-builder-conceptual-diagram.png" 
          alt="Operator Builder conceptual diagram: Audience Persona -> Operator Builder -> Operator Type" 
          className="mx-auto mb-6 max-w-lg w-full h-auto rounded-lg shadow-md"
        />
      </div>
      <div className="flex justify-between items-center mb-6">
        {/* Subtitle was here, moved above image for better flow */}
        {!showForm && (<Button variant="primary" onClick={() => { setShowForm(true); setEditingOperator(undefined); setError(null); }} disabled={personas.length === 0}>Create New Operator</Button>)}
      </div>

      {personas.length === 0 && (
        <PrerequisiteMessageCard
          title="Prerequisite Missing"
          message="Please create at least one Persona in 'Audience Modeling' before building an Operator. The 'Create New Operator' button will be enabled once a persona exists."
          action={onNavigate ? { label: 'Go to Audience Modeling', onClick: () => navigateTo(ViewName.AudienceModeling) } : undefined}
        />
      )}

      {error && !showForm && <Card className="mb-4 bg-red-100 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}
      
      {showForm ? (
        <Card title={editingOperator ? "Edit Operator" : "Create New Operator"}>
          <OperatorForm 
            initialOperator={editingOperator} 
            personas={personas} 
            onSubmitForm={handleFormSubmit} 
            onCancel={() => { setShowForm(false); setEditingOperator(undefined); setError(null);}} 
            isLoading={isLoading} 
            onSuggestOperatorDetails={handleSuggestOperatorDetails} 
          />
        </Card>
      ) : (
        <>
          {operators.length === 0 && !isLoading && personas.length > 0 && ( 
            <Card className="text-center">
              <p className="text-textSecondary text-lg">No operators created yet.</p>
              <p className="text-textSecondary">Click "Create New Operator" to design one.</p>
            </Card>
          )}
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
