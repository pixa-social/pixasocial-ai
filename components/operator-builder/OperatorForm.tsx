
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useForm, Controller, SubmitHandler, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Operator, Persona, RSTProfile, UserProfile, AIOperatorEffectivenessAnalysis } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { useToast } from '../ui/ToastProvider';
import { generateJson } from '../../services/aiService';
import { OPERATOR_TYPES, RST_TRAITS } from '../../constants';
import RstVisualBar from '../audience-modeling/RstVisualBar';
import { TrashIcon, LightBulbIcon, SparklesIcon } from '../ui/Icons';


const operatorFormSchema = z.object({
  name: z.string().min(1, "Operator name is required"),
  target_audience_id: z.number().min(1, "A target audience must be selected."),
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
  currentUser: UserProfile;
  onAddOperator: (operatorData: Omit<Operator, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  onUpdateOperator: (operatorId: number, operatorData: Partial<Omit<Operator, 'id' | 'user_id' | 'created_at'>>) => void;
  onDelete?: (operatorId: number) => void;
  onCancel?: () => void;
  onAnalyze?: (operatorData: Operator, persona: Persona) => void;
}

interface AiOperatorSuggestion {
    cs: string;
    us: string;
    reinforcementLoop: string;
}

export const OperatorForm: React.FC<OperatorFormProps> = ({
  initialOperator,
  personas,
  currentUser,
  onAddOperator,
  onUpdateOperator,
  onDelete,
  onCancel,
  onAnalyze
}) => {
  const { showToast } = useToast();
  const { control, register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<OperatorFormData>({
    resolver: zodResolver(operatorFormSchema),
    defaultValues: {
      name: initialOperator?.name || '',
      target_audience_id: initialOperator?.target_audience_id,
      type: initialOperator?.type || 'Custom',
      conditioned_stimulus: initialOperator?.conditioned_stimulus || '',
      unconditioned_stimulus: initialOperator?.unconditioned_stimulus || '',
      desired_conditioned_response: initialOperator?.desired_conditioned_response || '',
      reinforcement_loop: initialOperator?.reinforcement_loop || '',
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAmplifyingCR, setIsAmplifyingCR] = useState(false);
  const watchTargetAudienceId = watch("target_audience_id");
  const watchType = watch("type");
  const watchDesiredCR = watch("desired_conditioned_response");

  const selectedPersona = useMemo(() => personas.find(p => p.id === watchTargetAudienceId), [personas, watchTargetAudienceId]);
  const hasNoCredits = currentUser.ai_usage_count_monthly >= currentUser.role.max_ai_uses_monthly;

  const handleSuggestClick = useCallback(async () => {
    if (!watchTargetAudienceId || !watchType || !watchDesiredCR) {
        showToast("Please select target audience, operator type, and desired response first.", "error"); return;
    }
    const persona = personas.find(p => p.id === watchTargetAudienceId);
    if (!persona) return;

    setIsSuggesting(true);
    const prompt = `Persona: ${JSON.stringify(persona)}, Goal: Operator Type ${watchType}, Desired CR: ${watchDesiredCR}. Suggest CS, US, and Reinforcement Loop. JSON: {"cs": "...", "us": "...", "reinforcementLoop": "..."}`;
    const result = await generateJson<AiOperatorSuggestion>(prompt, currentUser); 
    
    if (result.data) {
        if(result.data.cs) setValue("conditioned_stimulus", result.data.cs, { shouldDirty: true });
        if(result.data.us) setValue("unconditioned_stimulus", result.data.us, { shouldDirty: true });
        if(result.data.reinforcementLoop) setValue("reinforcement_loop", result.data.reinforcementLoop, { shouldDirty: true });
        showToast("AI suggestions populated!", "success");
    } else { showToast(result.error || "AI suggestion failed.", "error"); }
    setIsSuggesting(false);
  }, [personas, watchTargetAudienceId, watchType, watchDesiredCR, showToast, setValue, currentUser]);

  const handleAmplifyCR = useCallback(async () => {
    if (!watchTargetAudienceId || !watchDesiredCR) {
        showToast("Please select a target audience and enter a desired response to amplify.", "error"); return;
    }
    const persona = personas.find(p => p.id === watchTargetAudienceId);
    if (!persona) return;

    setIsAmplifyingCR(true);
    const prompt = `Based on this persona: ${JSON.stringify(persona)}, rewrite the following desired conditioned response to be more impactful and psychologically resonant: "${watchDesiredCR}". Return only the rewritten response as a JSON object with a single key "amplified_response".`;
    
    const result = await generateJson<{ amplified_response: string }>(prompt, currentUser); 
    
    if (result.data?.amplified_response) {
        setValue("desired_conditioned_response", result.data.amplified_response, { shouldDirty: true });
        showToast("Desired Response amplified!", "success");
    } else { 
        showToast(result.error || "AI amplification failed.", "error"); 
    }
    setIsAmplifyingCR(false);
  }, [personas, watchTargetAudienceId, watchDesiredCR, showToast, setValue, currentUser]);

  const personaOptions = useMemo(() => personas.map(p => ({ value: p.id, label: p.name })), [personas]);
  const operatorTypeOptions = useMemo(() => OPERATOR_TYPES.map(t => ({ value: t, label: t })), []);
  
  const handleFormSubmit: SubmitHandler<OperatorFormData> = async (formData) => {
    setIsSubmitting(true);
    try {
      if (initialOperator?.id) {
        await onUpdateOperator(initialOperator.id, formData);
      } else {
        await onAddOperator(formData as Omit<Operator, 'id' | 'user_id' | 'created_at' | 'updated_at'>);
      }
    } catch (e) { showToast(`Failed to save operator: ${(e as Error).message}`, 'error'); } 
    finally { setIsSubmitting(false); }
  };
  
  const handleAnalyzeClick = () => {
      if (onAnalyze && initialOperator?.id && selectedPersona) {
          onAnalyze(initialOperator, selectedPersona);
      } else {
          showToast("Please save the operator before analyzing.", "info");
      }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Input label="Operator Name" {...register("name")} error={errors.name?.message} />
      <Controller name="target_audience_id" control={control} render={({ field }) => ( <Select label="Target Audience Persona" {...field} value={field.value ?? ''} onChange={e => field.onChange(Number(e.target.value))} options={personaOptions} error={errors.target_audience_id?.message} /> )} />
      
      {selectedPersona?.rst_profile && (
        <Card title="Selected Persona's RST Profile" className="p-4">
            <div className="space-y-3">
                {RST_TRAITS.map(traitInfo => {
                    const rstProfile = selectedPersona.rst_profile as unknown as RSTProfile;
                    const level = rstProfile?.[traitInfo.key] || 'Not Assessed';
                    return (
                        <div key={traitInfo.key} className="text-xs" title={traitInfo.description}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-muted-foreground">{traitInfo.label.split(' (')[0]}</span>
                                <span className="font-semibold text-foreground">{level}</span>
                            </div>
                            <RstVisualBar level={level} />
                        </div>
                    );
                })}
            </div>
        </Card>
      )}

      <Controller name="type" control={control} render={({ field }) => ( <Select label="Operator Type" {...field} options={operatorTypeOptions} error={errors.type?.message} /> )} />
      <div className="relative group">
        <Textarea 
            label="Desired Conditioned Response (CR)" 
            {...register("desired_conditioned_response")} 
            error={errors.desired_conditioned_response?.message} 
            rows={2}
            containerClassName="mb-0"
        />
        <Button 
            type="button" 
            size="sm" 
            variant="ghost" 
            className="absolute top-0 right-0 text-primary opacity-60 group-hover:opacity-100 transition-opacity" 
            onClick={handleAmplifyCR} 
            isLoading={isAmplifyingCR} 
            disabled={isAmplifyingCR || !watchDesiredCR || !watchTargetAudienceId || hasNoCredits} 
            title="Amplify with AI" 
            leftIcon={<SparklesIcon className="w-4 h-4"/>}
        >
            Amplify
        </Button>
      </div>
      
      <div className="p-4 bg-background rounded-lg border border-border">
         <h4 className="text-sm font-semibold text-muted-foreground mb-2">Operator Components</h4>
         <Textarea label="Conditioned Stimulus (CS)" {...register("conditioned_stimulus")} error={errors.conditioned_stimulus?.message} rows={2} />
         <Textarea label="Unconditioned Stimulus (US)" {...register("unconditioned_stimulus")} error={errors.unconditioned_stimulus?.message} rows={2} containerClassName="mt-3"/>
         <Textarea label="Reinforcement Loop" {...register("reinforcement_loop")} error={errors.reinforcement_loop?.message} rows={2} containerClassName="mt-3"/>
         <Button type="button" variant="secondary" onClick={handleSuggestClick} isLoading={isSuggesting} disabled={!watchTargetAudienceId || !watchType || !watchDesiredCR || isSuggesting || hasNoCredits} className="mt-3" size="sm">
            Suggest Details with AI
         </Button>
         {hasNoCredits && <p className="mt-2 text-xs text-yellow-400">You have used all your AI credits for this month.</p>}
      </div>
      
      <div className="flex justify-between items-center flex-wrap gap-2 pt-4 border-t border-border">
        <div>
            {initialOperator?.id && onDelete && (
                 <Button type="button" variant="destructive" size="sm" onClick={() => onDelete(initialOperator.id)} leftIcon={<TrashIcon className="w-4 h-4"/>}>Delete</Button>
            )}
            {onCancel && <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>}
        </div>
        <div className="flex items-center gap-2">
            {initialOperator?.id && onAnalyze && (
                <Button type="button" variant="outline" size="sm" onClick={handleAnalyzeClick} disabled={hasNoCredits} leftIcon={<LightBulbIcon className="w-4 h-4" />}>
                    Analyze Operator
                </Button>
            )}
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting || !isDirty}>
                {initialOperator?.id ? 'Save Changes' : 'Create Operator'}
            </Button>
        </div>
      </div>
    </form>
  );
};
