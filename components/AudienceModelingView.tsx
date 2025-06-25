
import React, { useState, useCallback } from 'react';
import { Persona, RSTProfile, RSTTraitLevel } from '../types'; 
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson, generateText } from '../services/aiService';
import { DEFAULT_PERSONA_AVATAR, REGION_COUNTRY_OPTIONS, RST_TRAITS, RST_TRAIT_LEVEL_OPTIONS, RST_TRAIT_LEVELS } from '../constants'; 
import RstIntroductionGraphic from './RstIntroductionGraphic';
import { useToast } from './ui/ToastProvider'; // Import useToast

// Helper component for RST Visual Bar
const RstVisualBar: React.FC<{ level: RSTTraitLevel }> = ({ level }) => {
  const levelMap: Record<RSTTraitLevel, { width: string; color: string; label: string }> = {
    'Not Assessed': { width: 'w-[25%]', color: 'bg-gray-300', label: 'NA' }, // Use specific width for Tailwind JIT
    'Low':          { width: 'w-[50%]', color: 'bg-green-500', label: 'L' },
    'Medium':       { width: 'w-[75%]', color: 'bg-yellow-500', label: 'M' },
    'High':         { width: 'w-[100%]', color: 'bg-red-500', label: 'H' },
  };
  const currentLevel = levelMap[level] || levelMap['Not Assessed'];
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 my-1" title={level}>
      <div className={`${currentLevel.color} h-2.5 rounded-full ${currentLevel.width}`}></div>
    </div>
  );
};

interface AIPersonaSuggestion {
  demographics: string;
  psychographics: string;
  initialBeliefs: string;
  suggestedVulnerabilities?: string[];
  rstProfile?: { bas: string; bis: string; fffs: string; };
}

interface PersonaFormProps {
  initialPersona?: Persona;
  onSubmit: (persona: Omit<Persona, 'id' | 'avatarUrl'> & { vulnerabilities?: string[]; rstProfile?: RSTProfile }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.39-3.468 3.468.39 4.753 4.401 1.83c.772.321 1.415-.098.884-.868l-1.542-2.926 2.433-2.096 2.926 1.542c.77.518 1.589.097.868-.884l-1.83-4.401 4.753-.39 3.468-3.468-.39-4.753-4.401-1.83zm-1.022 6.425a.75.75 0 01.21-.527l1.542-1.542a.75.75 0 00-1.06-1.06l-1.542 1.542a.75.75 0 01-.527.21h-2.13a.75.75 0 000 1.5h2.13zm-5.262 2.132a.75.75 0 01.21-.527l1.542-1.542a.75.75 0 00-1.06-1.06l-1.542 1.542a.75.75 0 01-.527.21v-2.13a.75.75 0 00-1.5 0v2.13a.75.75 0 01-.527-.21l-1.542-1.542a.75.75 0 00-1.06 1.06l1.542 1.542a.75.75 0 01.21.527v2.13a.75.75 0 001.5 0v-2.13zM15 10.5a.75.75 0 01-.75.75h-2.13a.75.75 0 01-.527-.21l-1.542-1.542a.75.75 0 10-1.06 1.06l1.542 1.542a.75.75 0 01.21.527v2.13a.75.75 0 001.5 0v-2.13a.75.75 0 01.527.21l1.542 1.542a.75.75 0 101.06-1.06l-1.542-1.542a.75.75 0 01-.21-.527V8.37a.75.75 0 00-1.5 0v2.13z" clipRule="evenodd" />
  </svg>
);

const PersonaForm: React.FC<PersonaFormProps> = ({ initialPersona, onSubmit, onCancel, isLoading }): JSX.Element => {
  const [name, setName] = useState(initialPersona?.name || '');
  const [demographics, setDemographics] = useState(initialPersona?.demographics || '');
  const [psychographics, setPsychographics] = useState(initialPersona?.psychographics || '');
  const [initialBeliefs, setInitialBeliefs] = useState(initialPersona?.initialBeliefs || '');
  const [vulnerabilitiesInForm, setVulnerabilitiesInForm] = useState<string[]>(initialPersona?.vulnerabilities || []);
  const initialRstProfile = initialPersona?.rstProfile || RST_TRAITS.reduce((acc, trait) => { acc[trait.key] = 'Not Assessed'; return acc; }, {} as RSTProfile);
  const [rstProfileState, setRstProfileState] = useState<RSTProfile>(initialRstProfile);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [keyInterests, setKeyInterests] = useState<string>('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const handleRstProfileChange = (traitKey: keyof RSTProfile, value: RSTTraitLevel) => {
    setRstProfileState(prev => ({ ...prev, [traitKey]: value }));
  };

  const handleFetchAISuggestions = async () => {
    // ... (existing AI suggestion logic, uses setError which is fine) ...
    if (!selectedRegion) {
      setSuggestionError("Please select a Region/Country to get AI suggestions.");
      return;
    }
    setIsSuggesting(true);
    setSuggestionError(null);
    const rstProfileInstructions = RST_TRAITS.map(trait => `      "${trait.key}": "<Low|Medium|High>"`).join(",\n");
    const prompt = `Generate persona details for Region: ${selectedRegion}, Interests: ${keyInterests || "General"}. JSON: {"demographics": "...", "psychographics": "...", "initialBeliefs": "...", "suggestedVulnerabilities": ["...", "..."], "rstProfile": {${rstProfileInstructions}}}`;
    const systemInstruction = "You create audience personas with RST profiles. Ensure all JSON fields are populated and RST traits are 'Low', 'Medium', or 'High'.";
    const result = await generateJson<AIPersonaSuggestion>(prompt, systemInstruction);
    if (result.data) {
      setDemographics(result.data.demographics || '');
      setPsychographics(result.data.psychographics || '');
      setInitialBeliefs(result.data.initialBeliefs || '');
      setVulnerabilitiesInForm(result.data.suggestedVulnerabilities || []);
      if (result.data.rstProfile) {
        const updatedRstProfile = { ...RST_TRAITS.reduce((acc, trait) => { acc[trait.key] = 'Not Assessed'; return acc; }, {} as RSTProfile) };
        RST_TRAITS.forEach(trait => {
            const aiLevel = result.data?.rstProfile?.[trait.key];
            if (aiLevel && RST_TRAIT_LEVELS.includes(aiLevel as RSTTraitLevel) && aiLevel !== 'Not Assessed') { updatedRstProfile[trait.key] = aiLevel as RSTTraitLevel; }
            else if (aiLevel) { console.warn(`AI returned invalid RST level for ${trait.key}: ${aiLevel}. Defaulting to 'Not Assessed'.`);}
        });
        setRstProfileState(updatedRstProfile);
      }
    } else { setSuggestionError(result.error || "Failed to fetch AI suggestions."); }
    setIsSuggesting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, demographics, psychographics, initialBeliefs, vulnerabilities: vulnerabilitiesInForm, rstProfile: rstProfileState });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input label="Persona Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Card title="AI Content Assistance" className="bg-blue-50 p-4">
        <Select label="Region/Country Focus (for AI Suggestions)" options={REGION_COUNTRY_OPTIONS} value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} containerClassName="mb-2"/>
        <Input label="Key Interests/Topics (Optional, for AI)" value={keyInterests} onChange={e => setKeyInterests(e.target.value)} placeholder="e.g., sustainability, tech" containerClassName="mb-3"/>
        <Button type="button" variant="secondary" onClick={handleFetchAISuggestions} isLoading={isSuggesting} disabled={!selectedRegion || isSuggesting} leftIcon={<SparklesIcon />}>Suggest Details with AI</Button>
        {suggestionError && <p className="mt-2 text-xs text-danger">{suggestionError}</p>}
      </Card>
      <Textarea label="Demographics" value={demographics} onChange={(e) => setDemographics(e.target.value)} required placeholder="e.g., Age 25-35, urban..." />
      <Textarea label="Psychographics" value={psychographics} onChange={(e) => setPsychographics(e.target.value)} required placeholder="e.g., Values innovation..." />
      <Card title="RST Personality Profile (AI Suggested or Manual)" className="p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {RST_TRAITS.map(trait => (<Select key={trait.key} label={`${trait.label} (${rstProfileState[trait.key]})`} options={RST_TRAIT_LEVEL_OPTIONS} value={rstProfileState[trait.key]} onChange={e => handleRstProfileChange(trait.key, e.target.value as RSTTraitLevel)} title={trait.description} containerClassName="mb-0"/>))}
        </div>
        <p className="mt-3 text-xs text-gray-500">Assess each trait or use AI suggestions. Hover over trait labels for descriptions.</p>
        <div className="mt-4 p-3 bg-indigo-50 rounded border border-indigo-200 text-sm text-indigo-700">
            <h4 className="font-semibold mb-1 text-indigo-800">Messaging Notes (based on RST):</h4>
            <ul className="list-disc list-inside space-y-1">
                <li><strong>BAS:</strong> Use for reward-driven messaging (gains, pride, achievement, novelty).</li>
                <li><strong>BIS:</strong> Use for punishment-avoidance or uncertainty-reduction (safety, risk reduction, problem-solving).</li>
                <li><strong>FFFS:</strong> Use for fear-based urgency or threat-avoidance (immediate threats, critical alerts).</li>
            </ul>
        </div>
      </Card>
      <Textarea label="Initial Beliefs/Values" value={initialBeliefs} onChange={(e) => setInitialBeliefs(e.target.value)} required placeholder="e.g., Believes technology can solve..." />
      <div>
        <label className="block text-sm font-medium text-textSecondary mb-1">Vulnerabilities (AI Suggested or Manual)</label>
        <Textarea value={vulnerabilitiesInForm.join('\n')} onChange={(e) => setVulnerabilitiesInForm(e.target.value.split('\n').map(v => v.trim()).filter(v => v))} placeholder="List each vulnerability on a new line." rows={3}/>
        <p className="mt-1 text-xs text-gray-500">Enter one vulnerability per line.</p>
      </div>
      <div className="flex justify-end space-x-3 pt-3">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" isLoading={isLoading}>{initialPersona ? 'Update Persona' : 'Create Persona'}</Button>
      </div>
    </form>
  );
};

export const AudienceModelingView: React.FC<{ personas: Persona[]; onAddPersona: (persona: Persona) => void; onUpdatePersona: (persona: Persona) => void; }> = ({ personas, onAddPersona, onUpdatePersona }) => {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState<string | null>(null); // For form-level or non-toast errors
  const [individualLoading, setIndividualLoading] = useState<Record<string, boolean>>({});

  const handleCreateOrUpdatePersona = async (personaData: Omit<Persona, 'id' | 'avatarUrl'> & { vulnerabilities?: string[]; rstProfile?: RSTProfile }) => {
    setIsSubmitting(true); setError(null);
    try {
      const newOrUpdatedPersona: Persona = {
        id: editingPersona?.id || Date.now().toString(),
        name: personaData.name, demographics: personaData.demographics, psychographics: personaData.psychographics,
        initialBeliefs: personaData.initialBeliefs, vulnerabilities: personaData.vulnerabilities || [],
        rstProfile: personaData.rstProfile || RST_TRAITS.reduce((acc, trait) => { acc[trait.key] = 'Not Assessed'; return acc; }, {} as RSTProfile),
        avatarUrl: editingPersona?.avatarUrl || DEFAULT_PERSONA_AVATAR + `?random=${Date.now()}`,
      };
      if (editingPersona) onUpdatePersona(newOrUpdatedPersona);
      else onAddPersona(newOrUpdatedPersona);
      setShowForm(false); setEditingPersona(undefined);
    } catch (e) { setError((e as Error).message); showToast("Failed to save persona.", "error");} 
    finally { setIsSubmitting(false); }
  };
  
  const handleSimulateVulnerabilitiesOnCard = useCallback(async (persona: Persona) => {
    setIndividualLoading(prev => ({ ...prev, [persona.id]: true })); setError(null);
    const prompt = `Persona: ${persona.name}, Demo: ${persona.demographics}, Psycho: ${persona.psychographics}, Beliefs: ${persona.initialBeliefs}, RST: BAS ${persona.rstProfile?.bas}, BIS ${persona.rstProfile?.bis}, FFFS ${persona.rstProfile?.fffs}. Identify 3-5 key vulnerabilities. Return as comma-separated list.`;
    const result = await generateText(prompt, "Expert in psychological profiling. Return comma-separated vulnerabilities.");
    if (result.text) {
         const vulnerabilities = result.text.split(',').map(v => v.trim()).filter(v => v.length > 0);
         onUpdatePersona({ ...persona, vulnerabilities });
         showToast("Vulnerabilities refreshed with AI.", "success");
    } else { 
      const errText = result.error || "Failed to simulate vulnerabilities (AI returned no text or an error occurred).";
      setError(errText); // Keep form-level error for this as it's card-specific
      showToast(errText, "error");
    }
    setIndividualLoading(prev => ({ ...prev, [persona.id]: false }));
  }, [onUpdatePersona, showToast]);

  const handleEdit = (persona: Persona) => { setEditingPersona(persona); setShowForm(true); setError(null); };

  return (
    <div className="p-6">
      <RstIntroductionGraphic />
      <div className="flex justify-between items-center mb-6 mt-8">
        <h2 className="text-3xl font-bold text-textPrimary">Audience Persona Management</h2>
        {!showForm && (<Button variant="primary" onClick={() => { setShowForm(true); setEditingPersona(undefined); setError(null); }}>Create New Persona</Button>)}
      </div>
      {error && !showForm && <Card className="mb-4 bg-red-100 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}
      {showForm ? (
        <Card title={editingPersona ? "Edit Persona" : "Create New Persona"}>
          <PersonaForm initialPersona={editingPersona} onSubmit={handleCreateOrUpdatePersona} onCancel={() => { setShowForm(false); setEditingPersona(undefined); setError(null);}} isLoading={isSubmitting}/>
        </Card>
      ) : (
        <>
          {personas.length === 0 && !isSubmitting && (<Card className="text-center"><p className="text-textSecondary text-lg">No personas created yet.</p><p className="text-textSecondary">Click "Create New Persona".</p></Card>)}
          {isSubmitting && personas.length === 0 && <LoadingSpinner text="Loading personas..." />}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <Card key={persona.id} title={persona.name} className="flex flex-col justify-between">
                <div>
                  <img src={persona.avatarUrl || DEFAULT_PERSONA_AVATAR} alt={persona.name} className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-primary" />
                  <p className="text-sm text-textSecondary mb-1"><strong>Demographics:</strong> {persona.demographics}</p>
                  <p className="text-sm text-textSecondary mb-1"><strong>Psychographics:</strong> {persona.psychographics}</p>
                  <p className="text-sm text-textSecondary mb-3"><strong>Initial Beliefs:</strong> {persona.initialBeliefs}</p>
                  {persona.rstProfile && (
                    <div className="mt-2 mb-3 p-3 bg-indigo-50 rounded-md border border-indigo-200">
                        <h4 className="font-semibold text-sm text-indigo-700 mb-1">RST Profile:</h4>
                        {RST_TRAITS.map(traitInfo => (
                            <div key={traitInfo.key} className="text-xs text-indigo-600 mb-1.5">
                                <span className="font-medium">{traitInfo.label.split(' (')[0]}: </span>
                                <span>{persona.rstProfile?.[traitInfo.key] || 'Not Assessed'}</span>
                                <RstVisualBar level={persona.rstProfile?.[traitInfo.key] || 'Not Assessed'} />
                            </div>
                        ))}
                    </div>
                  )}
                  {persona.vulnerabilities && persona.vulnerabilities.length > 0 && (
                    <div className="mt-2 mb-3">
                      <h4 className="font-semibold text-sm text-textPrimary">Vulnerabilities:</h4>
                      <ul className="list-disc list-inside text-xs text-textSecondary">{persona.vulnerabilities.map((vul, idx) => <li key={idx}>{vul}</li>)}</ul>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(persona)}>Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleSimulateVulnerabilitiesOnCard(persona)} isLoading={individualLoading[persona.id]} leftIcon={<SparklesIcon />}>Refresh Vulnerabilities (AI)</Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
