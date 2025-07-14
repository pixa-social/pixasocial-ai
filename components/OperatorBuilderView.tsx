
import React, { useState, useCallback, useMemo } from 'react';
import { Operator, Persona, RSTProfile, ViewName, UserProfile } from '../types';
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
import { useForm, Controller, SubmitHandler, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TrashIcon } from './ui/Icons';

interface OperatorBuilderViewProps {
  currentUser: UserProfile;
  personas: Persona[];
  operators: Operator[];
  onAddOperator: (operatorData: Omit<Operator, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onUpdateOperator: (operatorId: number, operatorData: Partial<Omit<Operator, 'id' | 'user_id' | 'created_at'>>) => void;
  onDeleteOperator: (operatorId: number) => void;
  onNavigate?: (view: ViewName) => void;
}

const operatorFormSchema = z.object({
  name: z.string().min(1, "Operator name is required"),
  target_audience_id: z.coerce.number().min(1, "A target audience must be selected."),
  type: z.enum(OPERATOR_TYPES),
  desired_conditioned_response: z.string().min(1, "Desired conditioned response is required"),
  conditioned_stimulus: z.string().min(1, "Conditioned stimulus is required"),
  unconditioned_stimulus: z.string().min(1, "Unconditioned stimulus is required"),
  reinforcement_loop: z.string().min(1, "Reinforcement loop is required"),
});

type OperatorFormData = z.infer<typeof operatorFormSchema>;

interface OperatorFormProps {
  initialOperator?: Operator;
  personas: Persona[];
  onSubmitForm: SubmitHandler<OperatorFormData>;
  onCancel?: () => void;
  isLoading?: boolean;
  onSuggestOperatorDetails?: (details: { type: Operator['type'], target_audience_id: number, desiredCR: string }) => Promise<{cs?: string, us?: string, reinforcementLoop?: string} | null>;
  currentUser: UserProfile;
}

interface AiOperatorSuggestion {
    cs: string;
    us: string;
    reinforcementLoop: string;
}

const OperatorFormComponent: React.FC<OperatorFormProps> = ({ initialOperator, personas, onSubmitForm, onCancel, isLoading, onSuggestOperatorDetails, currentUser }) => {
  const { showToast } = useToast();
  const { control, register, handleSubmit, watch, setValue, formState: { errors } } = useForm<OperatorFormData>({
    resolver: zodResolver(operatorFormSchema),
    defaultValues: {
      name: initialOperator?.name || '',
      target_audience_id: initialOperator?.target_audience_id || undefined,
      type: initialOperator?.type || 'Custom',
      conditioned_stimulus: initialOperator?.conditioned_stimulus || '',
      unconditioned_stimulus: initialOperator?.unconditioned_stimulus || '',
      desired_conditioned_response: initialOperator?.desired_conditioned_response || '',
      reinforcement_loop: initialOperator?.reinforcement_loop || '',
    }
  });
  
  const [isSuggesting, setIsSuggesting] = useState(false);
  const watchTargetAudienceId = watch("target_audience_id");
  const watchType = watch("type");
  const watchDesiredCR = watch("desired_conditioned_response");

  const selectedPersona = useMemo(() => personas.find(p => p.id === watchTargetAudienceId), [personas, watchTargetAudienceId]);
  const hasNoCredits = currentUser.ai_usage_count_monthly >= currentUser.role.max_ai_uses_monthly;

  const handleSuggestClick = useCallback(async () => {
    if (!onSuggestOperatorDetails || !watchTargetAudienceId || !watchType || !watchDesiredCR) {
        showToast("Please select target audience, operator type, and desired response.", "error"); return;
    }
    setIsSuggesting(true);
    const suggestions = await onSuggestOperatorDetails({ type: watchType, target_audience_id: watchTargetAudienceId, desiredCR: watchDesiredCR });
    if (suggestions) {
        if(suggestions.cs) setValue("conditioned_stimulus", suggestions.cs);
        if(suggestions.us) setValue("unconditioned_stimulus", suggestions.us);
        if(suggestions.reinforcementLoop) setValue("reinforcement_loop", suggestions.reinforcementLoop);
        showToast("AI suggestions populated!", "success");
    } else { showToast("AI suggestion failed.", "error"); }
    setIsSuggesting(false);
  }, [onSuggestOperatorDetails, watchTargetAudienceId, watchType, watchDesiredCR, showToast, setValue]);

  const personaOptions = useMemo(() => personas.map(p => ({ value: p.id, label: p.name })), [personas]);
  const operatorTypeOptions = useMemo(() => OPERATOR_TYPES.map(t => ({ value: t, label: t })), []);

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
      <Input label="Operator Name" {...register("name")} error={errors.name?.message} />
      <Controller name="target_audience_id" control={control} render={({ field }) => ( <Select label="Target Audience Persona" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value))} options={personaOptions} error={errors.target_audience_id?.message} /> )} />
      {selectedPersona?.rst_profile && <Card title="Selected Persona's RST Profile" className="p-3 bg-indigo-900/20"><RstVisualBar level={(selectedPersona.rst_profile as any)?.bas || 'Not Assessed'} /></Card>}
      <Controller name="type" control={control} render={({ field }) => ( <Select label="Operator Type" {...field} options={operatorTypeOptions} error={errors.type?.message} /> )} />
      <Textarea label="Desired Conditioned Response (CR)" {...register("desired_conditioned_response")} error={errors.desired_conditioned_response?.message} />
      <Button type="button" variant="secondary" onClick={handleSuggestClick} isLoading={isSuggesting} disabled={!watchTargetAudienceId || !watchType || !watchDesiredCR || isSuggesting || hasNoCredits}>Suggest Details</Button>
      <Textarea label="Conditioned Stimulus (CS)" {...register("conditioned_stimulus")} error={errors.conditioned_stimulus?.message} />
      <Textarea label="Unconditioned Stimulus (US)" {...register("unconditioned_stimulus")} error={errors.unconditioned_stimulus?.message} />
      <Textarea label="Reinforcement Loop" {...register("reinforcement_loop")} error={errors.reinforcement_loop?.message} />
      <div className="flex justify-end space-x-3">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" isLoading={isLoading}>{initialOperator ? 'Update Operator' : 'Create Operator'}</Button>
      </div>
    </form>
  );
};

const OperatorBuilderViewComponent: React.FC<OperatorBuilderViewProps> = ({ currentUser, personas, operators, onAddOperator, onUpdateOperator, onDeleteOperator, onNavigate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const navigateTo = useNavigateToView(onNavigate);
  const { showToast } = useToast();

  const handleFormSubmit: SubmitHandler<FieldValues> = useCallback(async (operatorData) => {
    setIsLoading(true);
    try {
      if (editingOperator) {
        await onUpdateOperator(editingOperator.id, operatorData as Partial<Omit<Operator, 'id' | 'user_id' | 'created_at'>>);
      } else {
        await onAddOperator(operatorData as Omit<Operator, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
      }
      setShowForm(false);
      setEditingOperator(undefined);
    } catch (e) { showToast(`Failed to save operator: ${(e as Error).message}`, 'error'); } 
    finally { setIsLoading(false); }
  }, [editingOperator, onAddOperator, onUpdateOperator, showToast]);
  
  const handleDeleteOperator = useCallback(async (operatorId: number) => {
    if (window.confirm("Are you sure?")) {
      await onDeleteOperator(operatorId);
    }
  }, [onDeleteOperator]);

  const handleSuggestOperatorDetails = useCallback(async (details: { type: Operator['type'], target_audience_id: number, desiredCR: string }): Promise<AiOperatorSuggestion | null> => {
    const persona = personas.find(p => p.id === details.target_audience_id);
    if (!persona) return null;
    const prompt = `Persona: ${JSON.stringify(persona)}, Goal: Operator Type ${details.type}, Desired CR: ${details.desiredCR}. Suggest CS, US, and Reinforcement Loop. JSON: {"cs": "...", "us": "...", "reinforcementLoop": "..."}`;
    const result = await generateJson<AiOperatorSuggestion>(prompt, currentUser); 
    return result.data || null;
  }, [personas, currentUser]);

  const handleEdit = useCallback((operator: Operator) => {
    setEditingOperator(operator);
    setShowForm(true);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-2">Operator Builder</h2>
      <p className="text-textSecondary mb-4">Craft powerful operators to influence and engage your audience.</p>
      
      {!showForm && (<Button variant="primary" onClick={() => setShowForm(true)} disabled={personas.length === 0}>Create New Operator</Button>)}
      
      {personas.length === 0 && (
        <PrerequisiteMessageCard title="Prerequisite Missing" message="Please create at least one Persona before building an Operator." action={onNavigate ? { label: 'Go to Audience Modeling', onClick: () => navigateTo(ViewName.AudienceModeling) } : undefined} />
      )}

      {showForm ? (
        <Card title={editingOperator ? "Edit Operator" : "Create New Operator"} className="mt-6">
          <OperatorFormComponent initialOperator={editingOperator} personas={personas} onSubmitForm={handleFormSubmit} onCancel={() => setShowForm(false)} isLoading={isLoading} onSuggestOperatorDetails={handleSuggestOperatorDetails} currentUser={currentUser} />
        </Card>
      ) : (
        <div className="space-y-4 mt-6">
          {operators.map((op) => {
            const persona = personas.find(p => p.id === op.target_audience_id);
            return (
              <Card key={op.id} title={`${op.name} (${op.type})`}>
                <p className="text-sm text-textSecondary mb-1"><strong>Target:</strong> {persona?.name || 'N/A'}</p>
                <div className="mt-4 flex justify-between">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(op)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteOperator(op.id)}><TrashIcon className="w-4 h-4"/></Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const OperatorBuilderView = OperatorBuilderViewComponent;
