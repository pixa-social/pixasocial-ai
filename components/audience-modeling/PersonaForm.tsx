import React, { useState, useCallback } from 'react';
import { Persona, RSTProfile, RSTTraitLevel, UserProfile, Json } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select } from '../ui/Select';
import { generateJson, generateImages } from '../../services/aiService';
import { REGION_COUNTRY_OPTIONS, RST_TRAITS, RST_TRAIT_LEVEL_OPTIONS, RST_TRAIT_LEVELS, DEFAULT_PERSONA_AVATAR } from '../../constants';
import { WrenchScrewdriverIcon, SparklesIcon } from '../ui/Icons';
import { useToast } from '../ui/ToastProvider';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface AIPersonaSuggestion {
  demographics: string;
  psychographics: string;
  initialBeliefs: string;
  suggestedVulnerabilities?: string[];
  goals?: string[];
  fears?: string[];
  rstProfile?: { bas: string; bis: string; fffs: string; };
}

export interface PersonaFormProps {
  initialPersona?: Persona;
  onSubmit: (persona: Partial<Omit<Persona, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { name: string, avatar_base64?: string }) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  currentUser: UserProfile;
}

const PersonaFormComponent: React.FC<PersonaFormProps> = ({ initialPersona, onSubmit, onCancel, isLoading, currentUser }) => {
  const { showToast } = useToast();
  const [name, setName] = useState(initialPersona?.name || '');
  const [demographics, setDemographics] = useState(initialPersona?.demographics || '');
  const [psychographics, setPsychographics] = useState(initialPersona?.psychographics || '');
  const [initialBeliefs, setInitialBeliefs] = useState(initialPersona?.initial_beliefs || '');
  const [vulnerabilitiesInForm, setVulnerabilitiesInForm] = useState<string[]>(initialPersona?.vulnerabilities || []);
  const [goals, setGoals] = useState<string[]>(initialPersona?.goals || []);
  const [fears, setFears] = useState<string[]>(initialPersona?.fears || []);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(initialPersona?.avatar_url || null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  
  const defaultRstProfile = RST_TRAITS.reduce((acc, trait) => {
    acc[trait.key] = 'Not Assessed';
    return acc;
  }, {} as RSTProfile);
  const initialRstProfile = (initialPersona?.rst_profile as unknown as RSTProfile) || defaultRstProfile;
  const [rstProfileState, setRstProfileState] = useState<RSTProfile>(initialRstProfile);

  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [keyInterests, setKeyInterests] = useState<string>('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const hasNoCredits = currentUser.ai_usage_count_monthly >= currentUser.role.max_ai_uses_monthly;

  const handleRstProfileChange = useCallback((traitKey: keyof RSTProfile, value: RSTTraitLevel) => {
    setRstProfileState(prev => ({ ...prev, [traitKey]: value }));
  }, []);

  const handleGenerateAvatar = async () => {
    if (!demographics) {
        showToast("Please provide some demographic details for the avatar generation.", "error");
        return;
    }
    setIsGeneratingAvatar(true);
    showToast("Generating avatar, this may take a moment...", "info");
    const prompt = `Photorealistic portrait of a person based on these demographics: ${demographics}. A single person, close-up, high detail, studio lighting.`;
    const result = await generateImages(prompt, currentUser);
    if (result.images && result.images.length > 0) {
        setAvatarBase64(`data:image/jpeg;base64,${result.images[0]}`);
        showToast("Avatar generated successfully!", "success");
    } else {
        showToast(result.error || "Failed to generate avatar.", "error");
    }
    setIsGeneratingAvatar(false);
  };

  const handleFetchAISuggestions = useCallback(async () => {
    if (!selectedRegion) {
      setSuggestionError("Please select a Region/Country to get AI suggestions.");
      return;
    }
    setIsSuggesting(true);
    setSuggestionError(null);
    const rstProfileInstructions = RST_TRAITS.map(trait => `      "${trait.key}": "<Low|Medium|High>"`).join(",\\n");
    const prompt = `Generate persona details for Region: ${selectedRegion}, Interests: ${keyInterests || "General"}. JSON: {"demographics": "...", "psychographics": "...", "initialBeliefs": "...", "goals": ["...", "..."], "fears": ["...", "..."], "suggestedVulnerabilities": ["...", "..."], "rstProfile": {${rstProfileInstructions}}}`;
    const systemInstruction = "You are an AI assistant that creates audience personas. Your entire response must be a single, valid JSON object and nothing else. Do not include any explanatory text, comments, markdown formatting, or any characters outside of the JSON structure.";
    const result = await generateJson<AIPersonaSuggestion>(prompt, currentUser, systemInstruction);
    if (result.data) {
      setDemographics(result.data.demographics || '');
      setPsychographics(result.data.psychographics || '');
      setInitialBeliefs(result.data.initialBeliefs || '');
      setVulnerabilitiesInForm(result.data.suggestedVulnerabilities || []);
      setGoals(result.data.goals || []);
      setFears(result.data.fears || []);
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
  }, [selectedRegion, keyInterests, currentUser]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, demographics, psychographics, initial_beliefs: initialBeliefs, vulnerabilities: vulnerabilitiesInForm, goals, fears, rst_profile: rstProfileState as unknown as Json, avatar_base64: avatarBase64 });
  }, [onSubmit, name, demographics, psychographics, initialBeliefs, vulnerabilitiesInForm, goals, fears, rstProfileState, avatarBase64]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-start space-x-6">
        <div className="flex-1 space-y-6">
          <Input label="Persona Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Card title="AI Content Assistance" icon={<WrenchScrewdriverIcon className="w-5 h-5 text-primary"/>} className="bg-blue-950/30 border border-blue-800/50 p-4">
            <Select label="Region/Country Focus (for AI Suggestions)" options={REGION_COUNTRY_OPTIONS} value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} containerClassName="mb-2"/>
            <Input label="Key Interests/Topics (Optional, for AI)" value={keyInterests} onChange={e => setKeyInterests(e.target.value)} placeholder="e.g., sustainability, tech" containerClassName="mb-3"/>
            <Button 
                type="button" 
                variant="secondary" 
                onClick={handleFetchAISuggestions} 
                isLoading={isSuggesting} 
                disabled={!selectedRegion || isSuggesting || hasNoCredits}
                title={hasNoCredits ? "You have no AI credits remaining." : "Get AI suggestions"}
            >
                Suggest Details with AI
            </Button>
            {suggestionError && <p className="mt-2 text-xs text-danger">{suggestionError}</p>}
            {hasNoCredits && <p className="mt-2 text-xs text-yellow-400">You have used all your AI credits for this month.</p>}
          </Card>
        </div>
        <div className="w-1/3">
            <label className="block text-sm font-medium text-textSecondary mb-1">Persona Avatar</label>
            <div className="aspect-square w-full bg-card rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                {isGeneratingAvatar ? <LoadingSpinner /> : (
                  <img 
                    src={avatarBase64 || DEFAULT_PERSONA_AVATAR} 
                    alt="Persona Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.src = DEFAULT_PERSONA_AVATAR)}
                  />
                )}
            </div>
             <Button 
                type="button" 
                variant="secondary" 
                onClick={handleGenerateAvatar} 
                isLoading={isGeneratingAvatar}
                disabled={!demographics || hasNoCredits || isGeneratingAvatar}
                className="w-full mt-2"
                leftIcon={<SparklesIcon className="w-4 h-4"/>}
             >
                 Generate with AI
             </Button>
        </div>
      </div>
      
      <Textarea label="Demographics" value={demographics} onChange={(e) => setDemographics(e.target.value)} required placeholder="e.g., Age 25-35, urban..." />
      <Textarea label="Psychographics" value={psychographics} onChange={(e) => setPsychographics(e.target.value)} required placeholder="e.g., Values innovation..." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Textarea label="Goals" value={goals.join('\n')} onChange={(e) => setGoals(e.target.value.split('\n'))} placeholder="List each goal on a new line." rows={3}/>
        <Textarea label="Fears" value={fears.join('\n')} onChange={(e) => setFears(e.target.value.split('\n'))} placeholder="List each fear on a new line." rows={3}/>
      </div>
      
      <Card title="RST Personality Profile (AI Suggested or Manual)" className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {RST_TRAITS.map(trait => (<Select key={trait.key} label={`${trait.label} (${rstProfileState[trait.key]})`} options={RST_TRAIT_LEVEL_OPTIONS} value={rstProfileState[trait.key]} onChange={e => handleRstProfileChange(trait.key, e.target.value as RSTTraitLevel)} title={trait.description} containerClassName="mb-0"/>))}
        </div>
        <p className="mt-3 text-xs text-textSecondary">Assess each trait or use AI suggestions. Hover over trait labels for descriptions.</p>
        <div className="mt-4 p-3 bg-indigo-900/20 rounded border border-indigo-700/50 text-sm text-indigo-300">
            <h4 className="font-semibold mb-1 text-indigo-200">Messaging Notes (based on RST):</h4>
            <ul className="list-disc list-inside space-y-1 text-xs">
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
        <p className="mt-1 text-xs text-textSecondary">Enter one vulnerability per line.</p>
      </div>
      
      <div className="flex justify-end space-x-3 pt-3">
        {onCancel && <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" variant="primary" isLoading={isLoading}>{initialPersona ? 'Update Persona' : 'Create Persona'}</Button>
      </div>
    </form>
  );
};

export const PersonaForm = React.memo(PersonaFormComponent);
