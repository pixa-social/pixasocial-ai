import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Persona, RSTProfile, ViewName, RSTTraitLevel } from '../types'; 
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select, SelectOption } from './ui/Select';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { generateText } from '../services/aiService';
import { RST_TRAITS, DEFAULT_PERSONA_AVATAR, RST_FILTER_OPTIONS, ITEMS_PER_PAGE, RST_TRAIT_LEVELS } from '../constants'; 
import RstIntroductionGraphic from './RstIntroductionGraphic';
import { useToast } from './ui/ToastProvider'; 
import { PersonaForm, PersonaFormProps } from './audience-modeling/PersonaForm';
import { PersonaCard } from './audience-modeling/PersonaCard';
import { downloadJsonFile } from '../utils/fileUtils'; 
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowPathIcon, AdjustmentsHorizontalIcon, ChevronUpIcon, ChevronDownIcon } from './ui/Icons';
import { PrerequisiteMessageCard } from './ui/PrerequisiteMessageCard'; 

const ITEMS_PER_PAGE_OPTIONS = [
    { value: "6", label: "6 per page"},
    { value: "9", label: "9 per page"},
    { value: "12", label: "12 per page"},
    { value: "24", label: "24 per page"},
];

export const AudienceModelingView: React.FC<{ 
  personas: Persona[]; 
  onAddPersona: (persona: Persona) => void; 
  onUpdatePersona: (persona: Persona) => void; 
  onNavigate?: (view: ViewName) => void; 
}> = ({ personas, onAddPersona, onUpdatePersona, onNavigate }) => {
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const [error, setError] = useState<string | null>(null); 
  const [individualLoading, setIndividualLoading] = useState<Record<string, boolean>>({});
  const importPersonaFileRef = useRef<HTMLInputElement>(null);

  // Pagination, Filtering, Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(ITEMS_PER_PAGE);
  const [filterName, setFilterName] = useState('');
  const [filterRstBas, setFilterRstBas] = useState<RSTTraitLevel | 'Any'>('Any');
  const [filterRstBis, setFilterRstBis] = useState<RSTTraitLevel | 'Any'>('Any');
  const [filterRstFffs, setFilterRstFffs] = useState<RSTTraitLevel | 'Any'>('Any');
  const [sortField, setSortField] = useState<'name' | 'id'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const resetFiltersAndPagination = useCallback(() => {
    setFilterName('');
    setFilterRstBas('Any');
    setFilterRstBis('Any');
    setFilterRstFffs('Any');
    setSortField('id');
    setSortDirection('desc');
    setCurrentPage(1);
  }, []);


  const handleCreateOrUpdatePersona = async (personaData: Omit<Persona, 'id' | 'avatarUrl'> & { vulnerabilities?: string[]; rstProfile?: RSTProfile }) => {
    setIsSubmitting(true); setError(null);
    try {
      const cleanedNameSeed = (personaData.name.trim().toLowerCase().replace(/[^a-z0-9]/gi, '') || 'defaultseed');
      
      const newOrUpdatedPersona: Persona = {
        id: editingPersona?.id || Date.now().toString(),
        name: personaData.name, 
        demographics: personaData.demographics, 
        psychographics: personaData.psychographics,
        initialBeliefs: personaData.initialBeliefs, 
        vulnerabilities: personaData.vulnerabilities || [],
        rstProfile: personaData.rstProfile || RST_TRAITS.reduce((acc, trait) => { acc[trait.key] = 'Not Assessed'; return acc; }, {} as RSTProfile),
        avatarUrl: editingPersona?.avatarUrl || `https://picsum.photos/seed/${cleanedNameSeed}/100/100?noCache=${Date.now()}`,
      };
      if (editingPersona) onUpdatePersona(newOrUpdatedPersona);
      else onAddPersona(newOrUpdatedPersona);
      setShowForm(false); setEditingPersona(undefined);
      resetFiltersAndPagination(); // Reset view
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
      setError(errText); 
      showToast(errText, "error");
    }
    setIndividualLoading(prev => ({ ...prev, [persona.id]: false }));
  }, [onUpdatePersona, showToast]);

  const handleEdit = (persona: Persona) => { setEditingPersona(persona); setShowForm(true); setError(null); };

  const handleDownloadPersonas = () => {
    if (personas.length === 0) {
      showToast("No personas to download.", "info");
      return;
    }
    try {
      const filename = `pixasocial_personas_${new Date().toISOString().split('T')[0]}.json`;
      downloadJsonFile(personas, filename); // Downloads ALL personas
      showToast("All personas downloaded successfully!", "success");
    } catch (error) {
      console.error("Error downloading personas:", error);
      showToast(`Failed to download personas: ${(error as Error).message}`, "error");
    }
  };

  const handleImportPersonasFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedContent = e.target?.result;
          if (typeof importedContent === 'string') {
            const parsedPersonas = JSON.parse(importedContent);
            if (!Array.isArray(parsedPersonas)) {
              throw new Error("Imported JSON is not an array of personas.");
            }
            let importedCount = 0;
            parsedPersonas.forEach((importedPersona: any) => {
              if (!importedPersona.name || !importedPersona.demographics || !importedPersona.psychographics || !importedPersona.initialBeliefs) {
                console.warn("Skipping an imported persona due to missing required fields:", importedPersona);
                return; 
              }
              
              const cleanedNameSeed = (importedPersona.name.trim().toLowerCase().replace(/[^a-z0-9]/gi, '') || 'defaultseed');
              const newPersona: Persona = {
                id: Date.now().toString() + Math.random().toString(36).substring(2,7), 
                name: importedPersona.name,
                demographics: importedPersona.demographics,
                psychographics: importedPersona.psychographics,
                initialBeliefs: importedPersona.initialBeliefs,
                vulnerabilities: Array.isArray(importedPersona.vulnerabilities) ? importedPersona.vulnerabilities : [],
                avatarUrl: importedPersona.avatarUrl || `https://picsum.photos/seed/${cleanedNameSeed}/100/100?noCache=${Date.now()}` || DEFAULT_PERSONA_AVATAR,
                rstProfile: importedPersona.rstProfile || RST_TRAITS.reduce((acc, trait) => { acc[trait.key] = 'Not Assessed'; return acc; }, {} as RSTProfile),
              };
              onAddPersona(newPersona);
              importedCount++;
            });
            showToast(`${importedCount} persona(s) processed from import. Check list for details.`, "success");
            if(importedCount > 0) resetFiltersAndPagination();

          } else {
            throw new Error("Failed to read file content as text.");
          }
        } catch (error) {
          console.error("Error parsing imported persona JSON:", error);
          showToast(`Failed to import personas: ${(error as Error).message}`, "error");
        } finally {
          if (importPersonaFileRef.current) {
            importPersonaFileRef.current.value = "";
          }
        }
      };
      reader.onerror = () => {
        showToast("Failed to read the selected file for persona import.", "error");
        if (importPersonaFileRef.current) {
            importPersonaFileRef.current.value = "";
        }
      };
      reader.readAsText(file);
    }
  };

  const processedPersonas = useMemo(() => {
    let filtered = [...personas];

    if (filterName) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(filterName.toLowerCase()));
    }
    if (filterRstBas !== 'Any') {
      filtered = filtered.filter(p => p.rstProfile?.bas === filterRstBas);
    }
    if (filterRstBis !== 'Any') {
      filtered = filtered.filter(p => p.rstProfile?.bis === filterRstBis);
    }
    if (filterRstFffs !== 'Any') {
      filtered = filtered.filter(p => p.rstProfile?.fffs === filterRstFffs);
    }

    filtered.sort((a, b) => {
      if (sortField === 'name') {
        return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      // Default to ID (creation date)
      return sortDirection === 'asc' ? parseInt(a.id) - parseInt(b.id) : parseInt(b.id) - parseInt(a.id);
    });

    return filtered;
  }, [personas, filterName, filterRstBas, filterRstBis, filterRstFffs, sortField, sortDirection]);

  const totalPages = Math.ceil(processedPersonas.length / itemsPerPage);
  const paginatedPersonas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedPersonas.slice(startIndex, startIndex + itemsPerPage);
  }, [processedPersonas, currentPage, itemsPerPage]);

  useEffect(() => { // Reset to page 1 if filters change and current page becomes invalid
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const sortOptions: SelectOption[] = [
    { value: 'id', label: 'Creation Date' },
    { value: 'name', label: 'Name' },
  ];


  return (
    <div className="p-6">
      <RstIntroductionGraphic />
      <div className="flex justify-between items-center mb-6 mt-2">
        <h2 className="text-3xl font-bold text-textPrimary">Audience Persona Management</h2>
        {!showForm && (<Button variant="primary" onClick={() => { setShowForm(true); setEditingPersona(undefined); setError(null); }}>Create New Persona</Button>)}
      </div>
      {error && !showForm && <Card className="mb-4 bg-red-100 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}
      
      {!showForm && (
        <>
        <Card title="Filters & Sorting" className="mb-6" shadow="soft-md" icon={<AdjustmentsHorizontalIcon className="w-5 h-5"/>}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input 
              label="Filter by Name" 
              value={filterName} 
              onChange={e => setFilterName(e.target.value)} 
              placeholder="Search name..." 
              containerClassName="mb-0"
            />
            <Select 
              label="Filter by BAS" 
              options={RST_FILTER_OPTIONS} 
              value={filterRstBas} 
              onChange={e => setFilterRstBas(e.target.value as RSTTraitLevel | 'Any')} 
              containerClassName="mb-0"
            />
            <Select 
              label="Filter by BIS" 
              options={RST_FILTER_OPTIONS} 
              value={filterRstBis} 
              onChange={e => setFilterRstBis(e.target.value as RSTTraitLevel | 'Any')} 
              containerClassName="mb-0"
            />
            <Select 
              label="Filter by FFFS" 
              options={RST_FILTER_OPTIONS} 
              value={filterRstFffs} 
              onChange={e => setFilterRstFffs(e.target.value as RSTTraitLevel | 'Any')} 
              containerClassName="mb-0"
            />
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                 <Select 
                    label="Sort by" 
                    options={sortOptions} 
                    value={sortField} 
                    onChange={e => setSortField(e.target.value as 'name' | 'id')} 
                    containerClassName="mb-0"
                />
                <Button 
                    variant="outline" 
                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="self-end h-10"
                    title={`Sort ${sortDirection === 'asc' ? 'Descending' : 'Ascending'}`}
                    rightIcon={sortDirection === 'asc' ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                >
                    {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                </Button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-lightBorder flex flex-wrap gap-2 justify-between items-center">
            <Button variant="ghost" onClick={resetFiltersAndPagination} leftIcon={<ArrowPathIcon className="w-4 h-4"/>} size="sm">
                Reset All Filters & Sort
            </Button>
            <Select 
                label=""
                options={ITEMS_PER_PAGE_OPTIONS}
                value={itemsPerPage.toString()}
                onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
                containerClassName="mb-0 w-auto inline-block"
                className="text-sm"
                title="Items per page"
            />
          </div>
        </Card>

        <Card title="Bulk Persona Management" className="mb-6" shadow="soft-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-md font-semibold text-textPrimary mb-1">Import Personas</h4>
              <p className="text-xs text-textSecondary mb-2">Upload a JSON file containing an array of persona objects. New IDs will be generated for imported personas.</p>
              <input 
                type="file" 
                accept=".json"
                onChange={handleImportPersonasFileChange}
                className="hidden"
                ref={importPersonaFileRef}
                id="import-personas-input"
              />
              <Button 
                variant="outline" 
                onClick={() => importPersonaFileRef.current?.click()}
                leftIcon={<ArrowUpTrayIcon className="w-4 h-4"/>}
                title="Import personas from a JSON file"
              >
                Add Personas from JSON File
              </Button>
            </div>
            <div>
              <h4 className="text-md font-semibold text-textPrimary mb-1">Download Personas</h4>
              <p className="text-xs text-textSecondary mb-2">Download all your current personas as a single JSON file. Filters are not applied to download.</p>
              <Button 
                variant="outline" 
                onClick={handleDownloadPersonas}
                disabled={personas.length === 0}
                leftIcon={<ArrowDownTrayIcon className="w-4 h-4"/>}
                title="Download all personas as JSON"
              >
                Download All Personas
              </Button>
            </div>
          </div>
        </Card>
        </>
      )}

      {showForm ? (
        <Card title={editingPersona ? "Edit Persona" : "Create New Persona"}>
          <PersonaForm 
            initialPersona={editingPersona} 
            onSubmit={handleCreateOrUpdatePersona} 
            onCancel={() => { setShowForm(false); setEditingPersona(undefined); setError(null);}} 
            isLoading={isSubmitting}
          />
        </Card>
      ) : (
        <>
          {personas.length === 0 && !isSubmitting && (
            <PrerequisiteMessageCard 
              title="No Personas Yet"
              message="Get started by clicking 'Create New Persona' to define your first audience profile."
              action={!onNavigate ? undefined : { label: 'Create New Persona Guide (Methodology)', onClick: () => onNavigate(ViewName.Methodology)}}
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
                    isRefreshingVulnerabilities={individualLoading[persona.id] || false}
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
