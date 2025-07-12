

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Operator, Persona, RSTProfile, RSTTraitLevel, ViewName, UserProfile, Database } from '../types';
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
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../services/supabaseClient';
import { TrashIcon } from './ui/Icons';

interface OperatorBuilderViewProps {
  currentUser: UserProfile;
  onNavigate?: (view: ViewName) => void;
}

const operatorFormSchema = z.object({
  name: z.string().min(1, "Operator name is required"),
  target_audience_id: z.number().min(1, "Target audience is required"),
  type: z.enum(OPERATOR_TYPES as [Operator['type'], ...Operator['type'][]]),
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
        showToast("Please select target audience, operator type, and desired response to get suggestions.", "error");
        return;
    }
    setIsSuggesting(true);
    const suggestions = await onSuggestOperatorDetails({ type: watchType, target_audience_id: watchTargetAudienceId, desiredCR: watchDesiredCR });
    if (suggestions) {
        if(suggestions.cs) setValue("conditioned_stimulus", suggestions.cs);
        if(suggestions.us) setValue("unconditioned_stimulus", suggestions.us);
        if(suggestions.reinforcementLoop) setValue("reinforcement_loop", suggestions.reinforcementLoop);
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
        name="target_audience_id"
        control={control}
        render={({ field }) => (
          <Select 
            label="Target Audience Persona" 
            {...field} 
            options={personaOptions} 
            error={errors.target_audience_id?.message} 
            aria-invalid={!!errors.target_audience_id} 
            required 
            disabled={personas.length === 0}
            value={field.value ?? ''}
            onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
          />
        )}
      />
      
      {selectedPersona?.rst_profile && (
        <Card title="Selected Persona's RST Profile" className="p-3 bg-indigo-900/20 border border-indigo-500/30 text-xs mt-2" shadow="none">
          {RST_TRAITS.map(traitInfo => (
            <div key={traitInfo.key} className="mb-1">
              <span className="font-medium text-indigo-300">{traitInfo.label.split(' (')[0]}: </span>
              <span className="text-indigo-200">{(selectedPersona.rst_profile as unknown as RSTProfile)?.[traitInfo.key]}</span>
              <RstVisualBar level={(selectedPersona.rst_profile as unknown as RSTProfile)?.[traitInfo.key] || 'Not Assessed'} />
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
      <Textarea label="Desired Conditioned Response (CR)" {...register("desired_conditioned_response")} error={errors.desired_conditioned_response?.message} aria-invalid={!!errors.desired_conditioned_response} placeholder="e.g., Increased support, sharing positive content" required />
      
      <div className="my-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-md">
        <h4 className="font-semibold text-blue-300 mb-2">AI Suggestions</h4>
        {onSuggestOperatorDetails && (
            <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={handleSuggestClick} 
                isLoading={isSuggesting} 
                disabled={!watchTargetAudienceId || !watchType || !watchDesiredCR || isSuggesting || hasNoCredits}
                title={hasNoCredits ? "You have no AI credits remaining." : "Get AI suggestions"}
            >
                Suggest CS, US & Reinforcement
            </Button>
        )}
        <p className="text-xs text-textSecondary mt-1">AI can suggest Conditioned Stimulus, Unconditioned Stimulus, and Reinforcement Loop based on selections.</p>
        {hasNoCredits && <p className="mt-2 text-xs text-yellow-400">You have used all your AI credits for this month.</p>}
      </div>
      
      <Textarea label="Conditioned Stimulus (CS)" {...register("conditioned_stimulus")} error={errors.conditioned_stimulus?.message} aria-invalid={!!errors.conditioned_stimulus} placeholder="e.g., A specific symbol, phrase, or image type" required />
      <Textarea label="Unconditioned Stimulus (US)" {...register("unconditioned_stimulus")} error={errors.unconditioned_stimulus?.message} aria-invalid={!!errors.unconditioned_stimulus} placeholder="e.g., Positive news (for Hope); Threat warnings (for Fear)" required />
      <Textarea label="Reinforcement Loop" {...register("reinforcement_loop")} error={errors.reinforcement_loop?.message} aria-invalid={!!errors.reinforcement_loop} placeholder="e.g., Social validation, repeated exposure, echo chamber effects" required />
      
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


const OperatorBuilderViewComponent: React.FC<OperatorBuilderViewProps> = ({ currentUser, onNavigate }) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); 
  const navigateTo = useNavigateToView(onNavigate);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsDataLoading(true);
      const { data: operatorData, error: opError } = await supabase.from('operators').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
      const { data: personaData, error: pError } = await supabase.from('personas').select('*').eq('user_id', currentUser.id);

      if (opError) {
        setError(`Failed to fetch operators: ${opError.message}`);
        showToast(`Failed to fetch operators: ${opError.message}`, 'error');
      } else {
        setOperators(operatorData || []);
      }
      if (pError) {
        setError(prev => `${prev}\nFailed to fetch personas: ${pError.message}`);
        showToast(`Failed to fetch personas: ${pError.message}`, 'error');
      } else {
        setPersonas((personaData as Persona[]) || []);
      }
      setIsDataLoading(false);
    };

    fetchData();
  }, [currentUser.id, showToast]);

  const handleFormSubmit: SubmitHandler<OperatorFormData> = useCallback(async (operatorData) => {
    setIsLoading(true);
    setError(null);
    try {
      if (editingOperator) {
        const updatePayload: Database['public']['Tables']['operators']['Update'] = {
            ...operatorData,
            updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from('operators')
          .update(updatePayload)
          .eq('id', editingOperator.id)
          .select()
          .single();
        if (error) throw error;
        setOperators(prev => prev.map(o => o.id === data.id ? data : o));
        showToast("Operator updated", "success");
      } else {
        const newOperatorData: Database['public']['Tables']['operators']['Insert'] = { ...operatorData, user_id: currentUser.id };
        const { data, error } = await supabase
          .from('operators')
          .insert(newOperatorData)
          .select()
          .single();
        if (error) throw error;
        setOperators(prev => [data, ...prev]);
        showToast("Operator created", "success");
      }
      setShowForm(false);
      setEditingOperator(undefined);
    } catch (e) { 
      const err = e as Error;
      setError(err.message);
      showToast(`Failed to save operator: ${err.message}`, 'error');
    } 
    finally { setIsLoading(false); }
  }, [editingOperator, currentUser.id, showToast]);
  
  const handleDeleteOperator = useCallback(async (operatorId: number) => {
    if (window.confirm("Are you sure you want to delete this operator?")) {
        const { error: deleteError } = await supabase.from('operators').delete().eq('id', operatorId);
        if (deleteError) {
            if (deleteError.code === '23503') { // Foreign key violation
                showToast("Cannot delete operator. It is currently being used by a Content Draft.", "error");
            } else {
                showToast(`Failed to delete operator: ${deleteError.message}`, "error");
            }
        } else {
            setOperators(prev => prev.filter(o => o.id !== operatorId));
            showToast("Operator deleted.", "success");
        }
    }
  }, [showToast]);

  const handleSuggestOperatorDetails = useCallback(async (details: { type: Operator['type'], target_audience_id: number, desiredCR: string }): Promise<AiOperatorSuggestion | null> => {
    const persona = personas.find(p => p.id === details.target_audience_id);
    if (!persona) { setError("Target persona not found for suggestion."); return null; }

    const rstProfile = persona.rst_profile as unknown as RSTProfile | null;

    const prompt = `
      Persona Details:
      Name: ${persona.name}
      Demographics: ${persona.demographics}
      Psychographics: ${persona.psychographics}
      Initial Beliefs: ${persona.initial_beliefs}
      Vulnerabilities: ${persona.vulnerabilities?.join(', ') || 'Not specified'}
      RST Profile: BAS: ${rstProfile?.bas || 'N/A'}, BIS: ${rstProfile?.bis || 'N/A'}, FFFS: ${rstProfile?.fffs || 'N/A'}

      Campaign Goal: Operator Type: ${details.type}, Desired Conditioned Response (CR): "${details.desiredCR}"
      Based on these details, suggest a plausible Conditioned Stimulus (CS), an Unconditioned Stimulus (US), and a Reinforcement Loop.
      Return your suggestions as a JSON object with the EXACT keys "cs", "us", and "reinforcementLoop".
    `;
    const systemInstruction = "You are an expert in psychological operations and behavioral marketing. Provide creative, plausible suggestions for conditioning components. Ensure JSON output.";
    const result = await generateJson<AiOperatorSuggestion>(prompt, currentUser, systemInstruction); 
    if (result.data && result.data.cs && result.data.us && result.data.reinforcementLoop) {
        return { cs: result.data.cs.replace(/\\n/g, '\\n'), us: result.data.us.replace(/\\n/g, '\\n'), reinforcementLoop: result.data.reinforcementLoop.replace(/\\n/g, '\\n')};
    } else {
      setError(result.error || "AI suggestions for operator details failed or returned invalid format.");
      return null;
    }
  }, [personas, currentUser]);

  const handleEdit = useCallback((operator: Operator) => {
    setEditingOperator(operator);
    setShowForm(true);
    setError(null);
  }, []);

  if(isDataLoading) {
    return <div className="p-6"><LoadingSpinner text="Loading operators and personas..." /></div>;
  }
  
  return (
    <div className="p-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-textPrimary mb-2">Operator Builder</h2>
        <p className="text-textSecondary mb-4">
            Craft powerful operators to influence and engage your audience with precision.
        </p>
        <img 
          src="https://i.postimg.cc/nLLcr631/operator-builder-conceptual-diagram.png" 
          alt="Operator Builder conceptual diagram: Audience Persona -> Operator Builder -> Operator Type" 
          className="mx-auto mb-6 max-w-lg w-full h-auto rounded-lg shadow-md"
        />
      </div>
      <div className="flex justify-between items-center mb-6">
        {!showForm && (<Button variant="primary" onClick={() => { setShowForm(true); setEditingOperator(undefined); setError(null); }} disabled={personas.length === 0}>Create New Operator</Button>)}
      </div>

      {personas.length === 0 && (
        <PrerequisiteMessageCard
          title="Prerequisite Missing"
          message="Please create at least one Persona in 'Audience Modeling' before building an Operator. The 'Create New Operator' button will be enabled once a persona exists."
          action={onNavigate ? { label: 'Go to Audience Modeling', onClick: () => navigateTo(ViewName.AudienceModeling) } : undefined}
        />
      )}

      {error && !showForm && <Card className="mb-4 bg-red-500/10 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}
      
      {showForm ? (
        <Card title={editingOperator ? "Edit Operator" : "Create New Operator"}>
          <OperatorForm 
            initialOperator={editingOperator} 
            personas={personas} 
            onSubmitForm={handleFormSubmit} 
            onCancel={() => { setShowForm(false); setEditingOperator(undefined); setError(null);}} 
            isLoading={isLoading} 
            onSuggestOperatorDetails={handleSuggestOperatorDetails}
            currentUser={currentUser}
          />
        </Card>
      ) : (
        <>
          {operators.length === 0 && !isDataLoading && personas.length > 0 && ( 
            <Card className="text-center">
              <p className="text-textSecondary text-lg">No operators created yet.</p>
              <p className="text-textSecondary">Click "Create New Operator" to design one.</p>
            </Card>
          )}
          <div className="space-y-4">
            {operators.map((op) => {
              const persona = personas.find(p => p.id === op.target_audience_id);
              return (
                <Card key={op.id} title={`${op.name} (${op.type})`}>
                  <p className="text-sm text-textSecondary mb-1"><strong>Target Audience:</strong> {persona?.name || 'N/A'}</p>
                  <p className="text-sm text-textSecondary mb-1"><strong>CS:</strong> {op.conditioned_stimulus}</p>
                  <p className="text-sm text-textSecondary mb-1"><strong>US:</strong> {op.unconditioned_stimulus}</p>
                  <p className="text-sm text-textSecondary mb-1"><strong>Desired CR:</strong> {op.desired_conditioned_response}</p>
                  <p className="text-sm text-textSecondary mb-3"><strong>Reinforcement:</strong> {op.reinforcement_loop}</p>
                  <div className="mt-4 pt-4 border-t border-lightBorder flex justify-between items-center">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(op)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteOperator(op.id)}>
                        <TrashIcon className="w-4 h-4"/>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export const OperatorBuilderView = OperatorBuilderViewComponent;