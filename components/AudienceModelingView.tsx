

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Persona, RSTProfile, ViewName, RSTTraitLevel, UserProfile, LibraryPersona, Json, AIPersonaDeepDive } from '../types'; 
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select, SelectOption } from './ui/Select';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateJson, generateImages } from '../services/aiService';
import { getExecutionConfig } from '../services/ai/aiUtils';
import { supabase } from '../services/supabaseClient';
import { RST_TRAITS, DEFAULT_PERSONA_AVATAR, RST_FILTER_OPTIONS, ITEMS_PER_PAGE, RST_TRAIT_LEVELS } from '../constants'; 
import RstIntroductionGraphic from './RstIntroductionGraphic';
import { useToast } from './ui/ToastProvider'; 
import { PersonaForm } from './audience-modeling/PersonaForm';
import { PersonaCard } from './audience-modeling/PersonaCard';
import { PersonaDeepDiveModal } from './audience-modeling/PersonaDeepDiveModal';
import { ArrowPathIcon, AdjustmentsHorizontalIcon, ChevronUpIcon, ChevronDownIcon, ArrowDownOnSquareIcon } from './ui/Icons';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard';
import { PersonaLibraryModal } from './audience-modeling/PersonaLibraryModal';

const ITEMS_PER_PAGE_OPTIONS = [
    { value: "6", label: "6 per page"},
    { value: "9", label: "9 per page"},
    { value: "12", label: "12 per page"},
    { value: "24", label: "24 per page"},
];

interface AudienceModelingViewProps { 
  currentUser: UserProfile;
  personas: Persona[];
  onAddPersona: (personaData: Partial<Omit<Persona, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { name: string, avatar_base64?: string }) => void;
  onUpdatePersona: (personaId: number, personaData: Partial<Omit<Persona, 'id' | 'user_id' | 'created_at'>> & { avatar_base64?: string }) => void;
  onDeletePersona: (personaId: number) => void;
  onNavigate?: (view: ViewName) => void; 
}

interface AIPersonaSuggestion {
  demographics: string;
  psychographics: string;
  initial_beliefs: string;
  suggestedVulnerabilities?: string[];
  goals?: string[];
  fears?: string[];
  rst_profile?: { bas: string; bis: string; fffs: string; };
}

export const AudienceModelingView: React.FC<AudienceModelingViewProps> = ({ currentUser, personas, onAddPersona, onUpdatePersona, onDeletePersona, onNavigate }) => {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState<string | null>(null); 
  const [individualLoading, setIndividualLoading] = useState<Record<string, boolean>>({});
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isMappingPersona, setIsMappingPersona] = useState(false);

  // New state for Deep Dive
  const [deepDiveData, setDeepDiveData] = useState<{ persona: Persona; analysis: AIPersonaDeepDive } | null>(null);
  const [isDiving, setIsDiving] = useState<Record<string, boolean>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(ITEMS_PER_PAGE);
  const [filterName, setFilterName] = useState('');
  const [sortField, setSortField] = useState<'name' | 'id'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const resetFiltersAndPagination = useCallback(() => {
    setFilterName('');
    setSortField('id');
    setSortDirection('desc');
    setCurrentPage(1);
  }, []);

  const handleImportAndMapPersona = useCallback(async (libraryPersona: LibraryPersona) => {
    if (personas.length >= currentUser.role.max_personas) {
      showToast(`Persona limit reached.`, "error"); return;
    }
    setIsMappingPersona(true);
    showToast("AI is analyzing...", "info");
    const prompt = `Based on this persona data: ${JSON.stringify(libraryPersona, null, 2)}, generate a profile with "demographics", "psychographics", "initial_beliefs", "rst_profile", "suggestedVulnerabilities", "goals", and "fears".`;
    const result = await generateJson<AIPersonaSuggestion>(prompt, currentUser);

    if (result.data) {
        const seededPersona: Partial<Persona> = {
            name: libraryPersona.name,
            demographics: result.data.demographics || '',
            psychographics: result.data.psychographics || '',
            initial_beliefs: result.data.initial_beliefs || '',
            vulnerabilities: result.data.suggestedVulnerabilities || [],
            goals: result.data.goals || [],
            fears: result.data.fears || [],
            rst_profile: result.data.rst_profile as Json,
        };
        setEditingPersona(seededPersona as Persona);
        setShowForm(true);
        setIsLibraryOpen(false);
        showToast("Persona imported! Review and save.", "success");
    } else { showToast(result.error || "Failed to import persona.", "error"); }
    setIsMappingPersona(false);
  }, [currentUser, showToast, personas, currentUser.role.max_personas]);

  const handleCreateOrUpdatePersona = async (personaData: Partial<Omit<Persona, 'id' | 'user_id' | 'created_at' | 'updated_at'>> & { name: string, avatar_base64?: string }) => {
    setIsSubmitting(true); setError(null);
    try {
      if (editingPersona && 'id' in editingPersona) {
        await onUpdatePersona(editingPersona.id, personaData);
      } else {
        if (personas.length >= currentUser.role.max_personas) {
          throw new Error(`You have reached the maximum of ${currentUser.role.max_personas} personas.`);
        }
        await onAddPersona(personaData);
      }
      setShowForm(false); setEditingPersona(undefined);
    } catch (e) { 
      const err = e as Error;
      setError(err.message); 
      showToast(`Failed to save persona: ${err.message}`, "error");
    } 
    finally { setIsSubmitting(false); }
  };

  const handleDeletePersona = useCallback(async (personaId: number) => {
    if (window.confirm("Are you sure?")) {
      await onDeletePersona(personaId);
    }
  }, [onDeletePersona]);

  const handleSimulateVulnerabilitiesOnCard = useCallback(async (persona: Persona) => {
    setIndividualLoading(prev => ({ ...prev, [String(persona.id)]: true }));
    const prompt = `Persona: ${persona.name}, Demo: ${persona.demographics}. Identify 3-5 key vulnerabilities. Return comma-separated list.`;
    const result = await generateJson<{ vulnerabilities: string[] }>(prompt, currentUser);
    if (result.data?.vulnerabilities) {
      await onUpdatePersona(persona.id, { vulnerabilities: result.data.vulnerabilities });
      showToast("Vulnerabilities refreshed with AI.", "success");
    } else {
      showToast(result.error || "Failed to simulate vulnerabilities.", "error");
    }
    setIndividualLoading(prev => ({ ...prev, [String(persona.id)]: false }));
  }, [currentUser, onUpdatePersona, showToast]);

  const handleDeepDiveRequest = async (persona: Persona) => {
    setIsDiving(prev => ({...prev, [String(persona.id)]: true }));
    
    // 1. Check for existing deep dive
    const { data: existingDive, error: fetchError } = await supabase
        .from('persona_deep_dives')
        .select('*')
        .eq('persona_id', persona.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
    if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "no rows found"
        showToast(`Error fetching deep dive: ${fetchError.message}`, 'error');
        setIsDiving(prev => ({...prev, [String(persona.id)]: false }));
        return;
    }
    
    if (existingDive) {
        setDeepDiveData({ persona, analysis: { ...existingDive, marketingHooks: existingDive.marketing_hooks || [] } });
        showToast("Loaded existing deep dive analysis.", "info");
        setIsDiving(prev => ({...prev, [String(persona.id)]: false }));
        return;
    }

    // 2. If not found, generate a new one
    const rstProfile = persona.rst_profile as unknown as RSTProfile;
    const prompt = `
        Provide a deep dive analysis of the following persona. Return a valid JSON object.
        Persona: ${JSON.stringify({name: persona.name, demographics: persona.demographics, psychographics: persona.psychographics, goals: persona.goals, fears: persona.fears, rst_profile: rstProfile })}
        JSON structure: { "communicationStyle": "...", "mediaHabits": "...", "motivations": "...", "marketingHooks": ["...", "..."] }
    `;
    
    const execConfig = await getExecutionConfig('text', currentUser);
    const result = await generateJson<AIPersonaDeepDive>(prompt, currentUser);

    if (result.data) {
        // 3. Save the new dive to the database
        const { error: insertError } = await supabase
            .from('persona_deep_dives')
            .insert({
                persona_id: persona.id,
                user_id: currentUser.id,
                communication_style: result.data.communicationStyle,
                media_habits: result.data.mediaHabits,
                motivations: result.data.motivations,
                marketing_hooks: result.data.marketingHooks,
                ai_model_used: execConfig?.model || 'unknown',
            });
            
        if (insertError) {
            showToast(`Failed to save new deep dive: ${insertError.message}`, 'error');
        }

        setDeepDiveData({ persona, analysis: result.data });

    } else {
        showToast(result.error || "Failed to generate deep dive analysis.", 'error');
    }

    setIsDiving(prev => ({...prev, [String(persona.id)]: false }));
  };


  const handleEdit = (persona: Persona) => { setEditingPersona(persona); setShowForm(true); setError(null); };
  
  const processedPersonas = useMemo(() => {
    let filtered = [...personas];
    if (filterName) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(filterName.toLowerCase()));
    }
    return filtered.sort((a, b) => {
        const fieldA = a[sortField];
        const fieldB = b[sortField];
        if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
        if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
  }, [personas, filterName, sortField, sortDirection]);

  const totalPages = Math.ceil(processedPersonas.length / itemsPerPage);
  const paginatedPersonas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedPersonas.slice(startIndex, startIndex + itemsPerPage);
  }, [processedPersonas, currentPage, itemsPerPage]);

  const canCreatePersona = personas.length < currentUser.role.max_personas;

  return (
    <div className="p-6">
       {isLibraryOpen && <PersonaLibraryModal isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} onImport={handleImportAndMapPersona} isMapping={isMappingPersona} />}
       {deepDiveData && <PersonaDeepDiveModal data={deepDiveData} onClose={() => setDeepDiveData(null)} />}
      <RstIntroductionGraphic />
      <div className="flex justify-between items-center mb-6 mt-2 flex-wrap gap-2">
        <h2 className="text-3xl font-bold text-textPrimary">Audience Persona Management</h2>
        {!showForm && (
            <div className="flex gap-2">
                 <Button variant="secondary" onClick={() => setIsLibraryOpen(true)} disabled={!canCreatePersona} leftIcon={<ArrowDownOnSquareIcon className="w-5 h-5"/>}>Import from Library</Button>
                <Button variant="primary" onClick={() => { setShowForm(true); setEditingPersona(undefined); }} disabled={!canCreatePersona}>Create New Persona</Button>
            </div>
        )}
      </div>
       {!canCreatePersona && !showForm && <Card className="mb-4 bg-yellow-500/10 border-warning p-4"><p>Persona limit reached for your plan.</p></Card>}
       {error && !showForm && <Card className="mb-4 bg-red-500/10 border-danger p-4"><p>{error}</p></Card>}

      {showForm ? (
        <Card title={editingPersona ? "Edit Persona" : "Create New Persona"}>
          <PersonaForm initialPersona={editingPersona} onSubmit={handleCreateOrUpdatePersona} onCancel={() => setShowForm(false)} isLoading={isSubmitting} currentUser={currentUser} />
        </Card>
      ) : (
        <>
        <Card title="Filters & Sorting" className="mb-6" icon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Filter by Name" value={filterName} onChange={e => setFilterName(e.target.value)} containerClassName="mb-0"/>
            <Select label="Sort by" options={[{ value: 'id', label: 'Creation Date' }, { value: 'name', label: 'Name' }]} value={sortField} onChange={e => setSortField(e.target.value as 'name' | 'id')} containerClassName="mb-0"/>
            <Button variant="outline" onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} className="self-end h-10" rightIcon={sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}>
                {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
          <Button variant="ghost" onClick={resetFiltersAndPagination} leftIcon={<ArrowPathIcon className="w-4 h-4"/>} size="sm" className="mt-4">Reset</Button>
        </Card>
        
        {paginatedPersonas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPersonas.map((persona) => (
              <PersonaCard 
                key={persona.id} 
                persona={persona} 
                onEdit={handleEdit} 
                onDelete={handleDeletePersona} 
                onRefreshVulnerabilities={handleSimulateVulnerabilitiesOnCard} 
                isRefreshingVulnerabilities={individualLoading[String(persona.id)] || false} 
                currentUser={currentUser}
                onDeepDiveRequest={handleDeepDiveRequest}
              />
              ))}
          </div>
        ) : (
            <PrerequisiteMessageCard title="No Personas Found" message={personas.length > 0 ? "No personas match your current filters." : "Get started by creating a new persona."} />
        )}

        {totalPages > 1 && (
            <div className="mt-8 flex justify-between items-center">
              <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
              <span className="text-sm text-textSecondary">Page {currentPage} of {totalPages}</span>
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
        )}
        </>
      )}
    </div>
  );
};