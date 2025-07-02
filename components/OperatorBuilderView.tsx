import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Operator, Persona, ViewName } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson } from '../services/aiService';
import { useToast } from './ui/ToastProvider'; 
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard';
import { useNavigateToView } from '../hooks/useNavigateToView';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OPERATOR_TYPES, RST_TRAITS } from '../constants';
import RstVisualBar from './audience-modeling/RstVisualBar'; 
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { fetchOperators, saveOperator, updateOperator, deleteOperator } from '../services/operatorService';
import { fetchPersonas } from '../services/personaService';
import { motion, AnimatePresence } from 'framer-motion';

interface OperatorBuilderViewProps {
  onNavigate?: (view: ViewName) => void;
}

const operatorFormSchema = z.object({
  name: z.string().min(1, "Operator name is required"),
  targetAudienceId: z.string().min(1, "Target audience is required"),
  type: z.enum(OPERATOR_TYPES as [Operator['type'], ...Operator['type'][]], {
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
  onSubmitForm: (operator: OperatorFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  onSuggestOperatorDetails?: (details: { type: Operator['type'], targetAudienceId: string, desiredCR: string }) => Promise<{cs?: string, us?: string, reinforcementLoop?: string} | null>;
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

export const OperatorBuilderView: React.FC<OperatorBuilderViewProps> = ({ onNavigate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const { showToast } = useToast();
  const navigateTo = useNavigateToView(onNavigate);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const operatorsData = await fetchOperators();
      setOperators(operatorsData);
      const personasData = await fetchPersonas();
      setPersonas(personasData);
    } catch (err) {
      setError('Failed to load data from Pixasocial.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFormSubmit = useCallback(async (operatorData: OperatorFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const newOrUpdatedOperator: Operator = { ...operatorData, id: editingOperator?.id || Date.now().toString() };
      if (editingOperator) {
        const updatedOperator = await updateOperator(newOrUpdatedOperator.id, newOrUpdatedOperator);
        setOperators(prev => prev.map(op => (op.id === updatedOperator.id ? updatedOperator : op)));
      } else {
        const newOperator = await saveOperator(operatorData);
        setOperators(prev => [...prev, newOperator]);
      }
      setShowForm(false);
      setEditingOperator(undefined);
      showToast(editingOperator ? 'Operator updated successfully!' : 'Operator created successfully!', 'success');
    } catch (err) {
      setError(editingOperator ? 'Failed to update operator on Pixasocial.' : 'Failed to save operator to Pixasocial.');
      console.error(err);
      showToast(editingOperator ? 'Failed to update operator.' : 'Failed to create operator.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [editingOperator, showToast]);

  const handleSuggestOperatorDetails = useCallback(async (details: { type: Operator['type'], targetAudienceId: string, desiredCR: string }): Promise<{cs?: string, us?: string, reinforcementLoop?: string} | null> => {
    const persona = personas.find(p => p.id === details.targetAudienceId);
    if (!persona) {
      setError("Target persona not found for suggestion.");
      return null;
    }

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
    const result = await generateJson<{ cs: string; us: string; reinforcementLoop: string }>(prompt, systemInstruction); 
    if (result.data && result.data.cs && result.data.us && result.data.reinforcementLoop) {
      return { cs: result.data.cs.replace(/\\n/g, '\n'), us: result.data.us.replace(/\\n/g, '\n'), reinforcementLoop: result.data.reinforcementLoop.replace(/\\n/g, '\n') };
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

  const handleDownloadOperators = useCallback(() => {
    const operatorsJson = JSON.stringify(operators, null, 2);
    const blob = new Blob([operatorsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'operators.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Operators downloaded successfully!', 'success');
  }, [operators, showToast]);

  const handleUploadOperators = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      showToast('No file selected for upload.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        const uploadedOperators = JSON.parse(jsonData) as Operator[];
        if (!Array.isArray(uploadedOperators) || uploadedOperators.length === 0) {
          showToast('Invalid file format or empty data.', 'error');
          return;
        }

        setIsLoading(true);
        const newOperators: Operator[] = [];
        for (const op of uploadedOperators) {
          const { id, ...operatorData } = op;
          const savedOperator = await saveOperator(operatorData);
          newOperators.push(savedOperator);
        }
        setOperators(prev => [...prev, ...newOperators]);
        showToast(`${newOperators.length} operators uploaded successfully!`, 'success');
      } catch (err) {
        console.error('Error uploading operators:', err);
        showToast('Failed to upload operators. Check file format.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  }, [showToast]);

  // Pagination logic
  const totalPages = useMemo(() => Math.ceil(operators.length / itemsPerPage), [operators.length, itemsPerPage]);
  const paginatedOperators = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return operators.slice(startIndex, endIndex);
  }, [operators, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="p-6 bg-background min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl font-bold text-textPrimary mb-2">Operator Builder</h2>
        <p className="text-textSecondary text-lg mb-4">
          Craft powerful operators to influence and engage your audience with precision.
        </p>
        <img 
          src="/assets/operator-builder-conceptual-diagram.png" 
          alt="Operator Builder conceptual diagram: Audience Persona -> Operator Builder -> Operator Type" 
          className="mx-auto mb-6 max-w-lg w-full h-auto rounded-2xl shadow-lg"
        />
      </motion.div>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        {!showForm && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex gap-2"
          >
            <Button variant="primary" onClick={() => { setShowForm(true); setEditingOperator(undefined); setError(null); }} disabled={personas.length === 0}>
              Create New Operator
            </Button>
            <Button variant="secondary" onClick={handleDownloadOperators} disabled={operators.length === 0}>
              Download Operators
            </Button>
            <Button variant="ghost" onClick={() => document.getElementById('uploadOperators')?.click()} disabled={personas.length === 0}>
              Upload Operators
            </Button>
            <input
              type="file"
              id="uploadOperators"
              accept=".json"
              className="hidden"
              onChange={handleUploadOperators}
            />
          </motion.div>
        )}
        {operators.length > 0 && (
          <div className="text-textSecondary text-sm">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, operators.length)} of {operators.length} operators
          </div>
        )}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card title={editingOperator ? "Edit Operator" : "Create New Operator"} className="shadow-md rounded-2xl bg-surface border-border">
            <OperatorForm 
              initialOperator={editingOperator} 
              personas={personas} 
              onSubmitForm={handleFormSubmit} 
              onCancel={() => { setShowForm(false); setEditingOperator(undefined); setError(null);}} 
              isLoading={isLoading} 
              onSuggestOperatorDetails={handleSuggestOperatorDetails} 
            />
          </Card>
        </motion.div>
      ) : (
        <>
          {operators.length === 0 && !isLoading && personas.length > 0 && ( 
            <Card className="text-center shadow-md rounded-2xl bg-surface border-border">
              <p className="text-textSecondary text-lg">No operators created yet.</p>
              <p className="text-textSecondary">Click "Create New Operator" to design one.</p>
            </Card>
          )}
          {isLoading && operators.length === 0 && <LoadingSpinner text="Loading operators..." />}
          <AnimatePresence>
            <div className="space-y-6">
              {paginatedOperators.map((op, index) => {
                const persona = personas.find(p => p.id === op.targetAudienceId);
                return (
                  <motion.div
                    key={op.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-surface rounded-2xl shadow-md border border-border hover:shadow-lg transition-shadow duration-300"
                  >
                    <Card title={`${op.name} (${op.type})`}>
                      <p className="text-sm text-textSecondary mb-1"><strong>Target Audience:</strong> {persona?.name || 'N/A'}</p>
                      <p className="text-sm text-textSecondary mb-1"><strong>CS:</strong> {op.conditionedStimulus}</p>
                      <p className="text-sm text-textSecondary mb-1"><strong>US:</strong> {op.unconditionedStimulus}</p>
                      <p className="text-sm text-textSecondary mb-1"><strong>Desired CR:</strong> {op.desiredConditionedResponse}</p>
                      <p className="text-sm text-textSecondary mb-3"><strong>Reinforcement:</strong> {op.reinforcementLoop}</p>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(op)}>Edit</Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
          {operators.length > 0 && (
            <div className="flex flex-col items-center mt-6 space-y-2">
              <div className="flex space-x-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 ${page === currentPage ? 'bg-primary text-white' : 'text-textSecondary hover:bg-surface'}`}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="text-textSecondary hover:bg-surface"
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="text-textSecondary hover:bg-surface"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
