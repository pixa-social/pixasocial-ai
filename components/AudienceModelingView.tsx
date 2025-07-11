import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Persona, RSTProfile, ViewName, RSTTraitLevel, UserProfile, LibraryPersona } from '../types'; 
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select, SelectOption } from './ui/Select';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateText, generateJson } from '../services/aiService';
import { RST_TRAITS, DEFAULT_PERSONA_AVATAR, RST_FILTER_OPTIONS, ITEMS_PER_PAGE, RST_TRAIT_LEVELS } from '../constants'; 
import RstIntroductionGraphic from './RstIntroductionGraphic';
import { useToast } from './ui/ToastProvider'; 
import { PersonaForm } from './audience-modeling/PersonaForm';
import { PersonaCard } from './audience-modeling/PersonaCard';
import { ArrowPathIcon, AdjustmentsHorizontalIcon, ChevronUpIcon, ChevronDownIcon, ArrowDownOnSquareIcon } from './ui/Icons';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard';
import { supabase } from '../services/supabaseClient';
import { PersonaLibraryModal } from './audience-modeling/PersonaLibraryModal';

const ITEMS_PER_PAGE_OPTIONS = [
    { value: "6", label: "6 per page"},
    { value: "9", label: "9 per page"},
    { value: "12", label: "12 per page"},
    { value: "24", label: "24 per page"},
];

interface AudienceModelingViewProps { 
  currentUser: UserProfile;
  onNavigate?: (view: ViewName) => void; 
}

interface AIPersonaSuggestion {
  demographics: string;
  psychographics: string;
  initial_beliefs: string;
  suggestedVulnerabilities?: string[];
  rst_profile?: { bas: string; bis: string; fffs: string; };
}

export const AudienceModelingView: React.FC<AudienceModelingViewProps> = ({ currentUser, onNavigate }) => {
  const { showToast } = useToast();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState<string | null>(null); 
  const [individualLoading, setIndividualLoading] = useState<Record<string, boolean>>({});
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isMappingPersona, setIsMappingPersona] = useState(false);


  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(ITEMS_PER_PAGE);
  const [filterName, setFilterName] = useState('');
  const [filterRstBas, setFilterRstBas] = useState<RSTTraitLevel | 'Any'>('Any');
  const [filterRstBis, setFilterRstBis] = useState<RSTTraitLevel | 'Any'>('Any');
  const [filterRstFffs, setFilterRstFffs] = useState<RSTTraitLevel | 'Any'>('Any');
  const [sortField, setSortField] = useState<'name' | 'id'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchPersonas = useCallback(async () => {
    setIsDataLoading(true);
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .eq('user_id', currentUser.id)
      .order(sortField, { ascending: sortDirection === 'asc' });

    if (error) {
      setError(`Failed to fetch personas: ${error.message}`);
      showToast(`Failed to fetch personas: ${error.message}`, 'error');
    } else {
      setPersonas(data || []);
    }
    setIsDataLoading(false);
  }, [currentUser.id, showToast, sortField, sortDirection]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  const resetFiltersAndPagination = useCallback(() => {
    setFilterName('');
    setFilterRstBas('Any');
    setFilterRstBis('Any');
    setFilterRstFffs('Any');
    setSortField('id');
    setSortDirection('desc');
    setCurrentPage(1);
  }, []);

  const handleImportAndMapPersona = useCallback(async (libraryPersona: LibraryPersona) => {
    if (personas.length >= currentUser.role.max_personas) {
      showToast(`Persona limit of ${currentUser.role.max_personas} reached. Cannot import.`, "error");
      return;
    }
    setIsMappingPersona(true);
    showToast("AI is analyzing and translating the persona...", "info");

    const prompt = `
      You are an expert in psychological profiling. Based on the following persona data, generate a corresponding profile for our application.
      The persona is from a general library, adapt their traits into our specific format. The persona name must be "${libraryPersona.name}".

      Input Persona Data:
      ${JSON.stringify(libraryPersona, null, 2)}
      
      Your entire response must be a single, valid JSON object with the following fields:
      - "demographics": A summary of age, occupation, and other demographic data.
      - "psychographics": A summary of their personality, values, lifestyle, hobbies, goals and fears.
      - "initial_beliefs": Key beliefs and worldviews based on the provided info.
      - "rst_profile": An object with "bas", "bis", and "fffs" keys, each with a value of 'Low', 'Medium', or 'High' based on the persona's personality.
      - "suggestedVulnerabilities": An array of potential vulnerabilities.
    `;
    const result = await generateJson<AIPersonaSuggestion>(prompt, currentUser, "You create audience personas with RST profiles. Ensure all JSON fields are populated and RST traits are 'Low', 'Medium', or 'High'.");

    if (result.data) {
        const rstProfile: RSTProfile = { bas: 'Not Assessed', bis: 'Not Assessed', fffs: 'Not Assessed' };
        if (result.data.rst_profile) {
            Object.keys(rstProfile).forEach((key) => {
                const traitKey = key as keyof RSTProfile;
                const aiValue = result.data!.rst_profile![traitKey] as RSTTraitLevel;
                if (RST_TRAIT_LEVELS.includes(aiValue)) {
                    rstProfile[traitKey] = aiValue;
                }
            });
        }
        
        const seededPersona: Omit<Persona, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
            name: libraryPersona.name, // Use the original name from the library
            demographics: result.data.demographics || '',
            psychographics: result.data.psychographics || '',
            initial_beliefs: result.data.initial_beliefs || '',
            vulnerabilities: result.data.suggestedVulnerabilities || [],
            rst_profile: rstProfile,
            avatar_url: `https://picsum.photos/seed/${libraryPersona.name.trim().toLowerCase().replace(/[^a-z0-9]/gi, '')}/100/100?noCache=${Date.now()}`
        };
        
        setEditingPersona(seededPersona as Persona); // Cast for the form, which can handle partial data
        setShowForm(true);
        setIsLibraryOpen(false);
        showToast("Persona imported! Review and save.", "success");
    } else {
        showToast(result.error || "Failed to import persona from library.", "error");
    }
    setIsMappingPersona(false);
  }, [currentUser, showToast, personas, currentUser.role.max_personas]);


  const handleCreateOrUpdatePersona = async (personaData: Omit<Persona, 'id' | 'avatar_url' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setIsSubmitting(true); setError(null);
    try {
      if (editingPersona && 'id' in editingPersona) { // It's an existing persona being edited
        const { data, error } = await supabase
          .from('personas')
          .update({ ...personaData, updated_at: new Date().toISOString() })
          .eq('id', editingPersona.id)
          .select()
          .single();
        if (error) throw error;
        setPersonas(prev => prev.map(p => p.id === data.id ? data : p));
        showToast(`Persona "${data.name}" updated.`, "success");
      } else { // It's a new persona (either from scratch or imported)
        if (personas.length >= currentUser.role.max_personas) {
          throw new Error(`You have reached the maximum of ${currentUser.role.max_personas} personas for your '${currentUser.role.name}' plan.`);
        }
        const cleanedNameSeed = (personaData.name.trim().toLowerCase().replace(/[^a-z0-9]/gi, '') || 'defaultseed');
        const newPersonaData = {
          ...personaData,
          user_id: currentUser.id,
          avatar_url: `https://picsum.photos/seed/${cleanedNameSeed}/100/100?noCache=${Date.now()}`
        };
        const { data, error } = await supabase.from('personas').insert(newPersonaData).select().single();
        if (error) throw error;
        setPersonas(prev => [...prev, data]);
        showToast(`Persona "${data.name}" created.`, "success");
      }
      setShowForm(false); setEditingPersona(undefined);
      fetchPersonas(); // Refetch to ensure sorted list is correct
      resetFiltersAndPagination();
    } catch (e) { 
      const err = e as Error;
      setError(err.message); 
      showToast(`Failed to save persona: ${err.message}`, "error");
    } 
    finally { setIsSubmitting(false); }
  };

  const handleSimulateVulnerabilitiesOnCard = useCallback(async (persona: Persona) => {
    setIndividualLoading(prev => ({ ...prev, [String(persona.id)]: true })); setError(null);
    const prompt = `Persona: ${persona.name}, Demo: ${persona.demographics}, Psycho: ${persona.psychographics}, Beliefs: ${persona.initial_beliefs}, RST: BAS ${persona.rst_profile?.bas}, BIS ${persona.rst_profile?.bis}, FFFS ${persona.rst_profile?.fffs}. Identify 3-5 key vulnerabilities. Return as comma-separated list.`;
    const result = await generateText(prompt, currentUser, "Expert in psychological profiling. Return comma-separated list.");
    if (result.text) {
      const vulnerabilities = result.text.split(',').map(v => v.trim()).filter(v => v.length > 0);
      const { data, error } = await supabase
        .from('personas')
        .update({ vulnerabilities })
        .eq('id', persona.id)
        .select()
        .single();
      if (error) {
        setError(`Failed to update vulnerabilities: ${error.message}`);
        showToast(`Failed to update vulnerabilities: ${error.message}`, "error");
      } else {
        setPersonas(prev => prev.map(p => p.id === data.id ? data : p));
        showToast("Vulnerabilities refreshed with AI.", "success");
      }
    } else { 
      const errText = result.error || "Failed to simulate vulnerabilities (AI returned no text or an error occurred).";
      setError(errText); 
      showToast(errText, "error");
    }
    setIndividualLoading(prev => ({ ...prev, [String(persona.id)]: false }));
  }, [showToast, currentUser]);

  const handleEdit = (persona: Persona) => { setEditingPersona(persona); setShowForm(true); setError(null); };
  
  const processedPersonas = useMemo(() => {
    let filtered = [...personas];
    if (filterName) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(filterName.toLowerCase()));
    }
    if (filterRstBas !== 'Any') {
      filtered = filtered.filter(p => p.rst_profile?.bas === filterRstBas);
    }
    if (filterRstBis !== 'Any') {
      filtered = filtered.filter(p => p.rst_profile?.bis === filterRstBis);
    }
    if (filterRstFffs !== 'Any') {
      filtered = filtered.filter(p => p.rst_profile?.fffs === filterRstFffs);
    }
    return filtered;
  }, [personas, filterName, filterRstBas, filterRstBis, filterRstFffs]);

  const totalPages = Math.ceil(processedPersonas.length / itemsPerPage);
  const paginatedPersonas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedPersonas.slice(startIndex, startIndex + itemsPerPage);
  }, [processedPersonas, currentPage, itemsPerPage]);

  useEffect(() => { 
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const sortOptions: SelectOption[] = [
    { value: 'id', label: 'Creation Date' },
    { value: 'name', label: 'Name' },
  ];
  
  const canCreatePersona = personas.length < currentUser.role.max_personas;

  if (isDataLoading) {
    return <div className="p-6"><LoadingSpinner text="Loading personas..." /></div>;
  }

  return (
    <div className="p-6">
       {isLibraryOpen && (
        <PersonaLibraryModal
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          onImport={handleImportAndMapPersona}
          isMapping={isMappingPersona}
        />
      )}
      <RstIntroductionGraphic />
      <div className="flex justify-between items-center mb-6 mt-2 flex-wrap gap-2">
        <h2 className="text-3xl font-bold text-textPrimary">Audience Persona Management</h2>
        {!showForm && (
            <div className="flex gap-2">
                 <Button 
                    variant="secondary" 
                    onClick={() => setIsLibraryOpen(true)}
                    disabled={!canCreatePersona} 
                    leftIcon={<ArrowDownOnSquareIcon className="w-5 h-5"/>}
                    title={!canCreatePersona ? `Persona limit reached for your plan` : 'Import from Pixasocial Persona Library'}
                  >
                    Import from Library
                  </Button>
                <Button 
                    variant="primary" 
                    onClick={() => { setShowForm(true); setEditingPersona(undefined); setError(null); }} 
                    disabled={!canCreatePersona} 
                    title={!canCreatePersona ? `Persona limit reached for your plan` : 'Create a new persona'}
                >
                    Create New Persona
                </Button>
            </div>
        )}
      </div>
       {!canCreatePersona && !showForm && (
        <Card className="mb-4 bg-yellow-500/10 border-l-4 border-warning text-warning p-4">
          <p>You have reached the maximum of {currentUser.role.max_personas} personas for your '{currentUser.role.name}' plan. To create more, please upgrade your subscription.</p>
        </Card>
      )}
      {error && !showForm && <Card className="mb-4 bg-red-500/10 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}
      
      {!showForm && (
        <>
        <Card title="Filters & Sorting" className="mb-6" icon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Filter by Name" value={filterName} onChange={e => setFilterName(e.target.value)} placeholder="Search name..." containerClassName="mb-0"/>
            <Select label="Filter by BAS" options={RST_FILTER_OPTIONS} value={filterRstBas} onChange={e => setFilterRstBas(e.target.value as RSTTraitLevel | 'Any')} containerClassName="mb-0"/>
            <Select label="Filter by BIS" options={RST_FILTER_OPTIONS} value={filterRstBis} onChange={e => setFilterRstBis(e.target.value as RSTTraitLevel | 'Any')} containerClassName="mb-0"/>
            <Select label="Filter by FFFS" options={RST_FILTER_OPTIONS} value={filterRstFffs} onChange={e => setFilterRstFffs(e.target.value as RSTTraitLevel | 'Any')} containerClassName="mb-0"/>
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                 <Select label="Sort by" options={sortOptions} value={sortField} onChange={e => setSortField(e.target.value as 'name' | 'id')} containerClassName="mb-0"/>
                <Button variant="outline" onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} className="self-end h-10" title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`} rightIcon={sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}>
                    {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-lightBorder flex flex-wrap gap-2 justify-between items-center">
            <Button variant="ghost" onClick={resetFiltersAndPagination} leftIcon={<ArrowPathIcon className="w-4 h-4"/>} size="sm">Reset All Filters & Sort</Button>
            <Select label="" options={ITEMS_PER_PAGE_OPTIONS} value={itemsPerPage.toString()} onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }} containerClassName="mb-0 w-auto inline-block" className="text-sm" title="Items per page"/>
          </div>
        </Card>
        </>
      )}

      {showForm ? (
        <Card title={editingPersona && 'id' in editingPersona ? "Edit Persona" : "Create New Persona"}>
          <PersonaForm 
            initialPersona={editingPersona} 
            onSubmit={handleCreateOrUpdatePersona} 
            onCancel={() => { setShowForm(false); setEditingPersona(undefined); setError(null);}} 
            isLoading={isSubmitting}
            currentUser={currentUser}
          />
        </Card>
      ) : (
        <>
          {personas.length === 0 && !isSubmitting && (
            <PrerequisiteMessageCard 
              title="No Personas Yet"
              message="Get started by clicking 'Create New Persona' to define your first audience profile, or import one from the library."
              action={!onNavigate ? undefined : { label: 'Go to Documentation', onClick: () => onNavigate(ViewName.Methodology)}}
            />
           )}
          {isSubmitting && personas.length === 0 && <LoadingSpinner text="Loading personas..." />}

          {paginatedPersonas.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPersonas.map((persona) => (
                <PersonaCard
                    key={persona.id}
                    persona={persona}
                    onEdit={handleEdit}
                    onRefreshVulnerabilities={handleSimulateVulnerabilitiesOnCard}
                    isRefreshingVulnerabilities={individualLoading[String(persona.id)] || false}
                />
                ))}
            </div>
          )}

          {processedPersonas.length === 0 && personas.length > 0 && !isSubmitting && (
            <Card className="text-center p-6">
              <p className="text-textSecondary text-lg">No personas match your current filter criteria.</p>
              <Button variant="link" onClick={resetFiltersAndPagination} className="mt-2">Clear Filters</Button>
            </Card>
          )}
          
          {totalPages > 1 && (
            <div className="mt-8 flex justify-between items-center">
              <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} variant="secondary">Previous</Button>
              <span className="text-sm text-textSecondary">Page {currentPage} of {totalPages}</span>
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} variant="secondary">Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
