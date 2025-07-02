import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Persona, ViewName } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { generateJson } from '../../services/aiService';
import { useToast } from '../ui/ToastProvider';
import { useNavigateToView } from '../../hooks/useNavigateToView';
import { PersonaCard } from './PersonaCard';
import { PersonaForm } from './PersonaForm';
import { fetchPersonas, savePersona, updatePersona, deletePersona, importPersonasFromJson } from '../../services/personaService';
import { downloadJsonFile } from '../../utils/fileUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { Select } from '../ui/Select';

interface AudienceModelingViewProps {
  onNavigate?: (view: ViewName) => void;
}

export const AudienceModelingView: React.FC<AudienceModelingViewProps> = ({ onNavigate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const { showToast } = useToast();
  const navigateTo = useNavigateToView(onNavigate);

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterDemographic, setFilterDemographic] = useState('');
  const [filterPsychographic, setFilterPsychographic] = useState('');
  const [filterRstProfile, setFilterRstProfile] = useState('all');

  const loadPersonas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchPersonas();
      setPersonas(data);
    } catch (err) {
      setError('Failed to load personas from Pixasocial.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);

  const handleFormSubmit = useCallback(async (persona: Omit<Persona, 'id'> | Persona) => {
    setIsLoading(true);
    setError(null);
    try {
      if (editingPersona) {
        const updatedPersona = await updatePersona(editingPersona.id, persona);
        setPersonas(prev => prev.map(p => (p.id === updatedPersona.id ? updatedPersona : p)));
      } else {
        const newPersona = await savePersona(persona as Omit<Persona, 'id'>);
        setPersonas(prev => [...prev, newPersona]);
      }
      setShowForm(false);
      setEditingPersona(undefined);
      showToast(editingPersona ? 'Persona updated successfully!' : 'Persona created successfully!', 'success');
    } catch (err) {
      setError(editingPersona ? 'Failed to update persona on Pixasocial.' : 'Failed to save persona to Pixasocial.');
      console.error(err);
      showToast(editingPersona ? 'Failed to update persona.' : 'Failed to create persona.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [editingPersona, showToast]);

  const handleEdit = useCallback((persona: Persona) => {
    setEditingPersona(persona);
    setShowForm(true);
    setError(null);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await deletePersona(id);
      setPersonas(prev => prev.filter(p => p.id !== id));
      showToast('Persona deleted successfully!', 'success');
    } catch (err) {
      setError('Failed to delete persona from Pixasocial.');
      console.error(err);
      showToast('Failed to delete persona.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleRefreshVulnerabilities = useCallback(async (persona: Persona) => {
    setIsLoading(true);
    setError(null);
    try {
      const prompt = `
        Persona Details:
        Name: ${persona.name}
        Demographics: ${persona.demographics}
        Psychographics: ${persona.psychographics}
        Initial Beliefs: ${persona.initialBeliefs}
        RST Profile: BAS: ${persona.rstProfile?.bas || 'N/A'}, BIS: ${persona.rstProfile?.bis || 'N/A'}, FFFS: ${persona.rstProfile?.fffs || 'N/A'}

        Based on these details, suggest up to 5 specific psychological vulnerabilities or influence points for this persona.
        Return your suggestions as a JSON object with the key "vulnerabilities" containing an array of strings.
      `;
      const systemInstruction = "You are an expert in audience psychology and behavioral analysis. Provide insightful, specific vulnerabilities for influence based on the persona details. Ensure JSON output.";
      const result = await generateJson<{ vulnerabilities: string[] }>(prompt, systemInstruction);
      if (result.data && result.data.vulnerabilities) {
        const updatedPersona = await updatePersona(persona.id, { vulnerabilities: result.data.vulnerabilities });
        setPersonas(prev => prev.map(p => (p.id === updatedPersona.id ? updatedPersona : p)));
        showToast('Vulnerabilities refreshed with AI insights!', 'success');
      } else {
        throw new Error(result.error || "AI response failed or returned invalid format.");
      }
    } catch (err) {
      setError('Failed to refresh vulnerabilities with AI.');
      console.error(err);
      showToast('Failed to refresh vulnerabilities.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleDownloadPersonas = useCallback(() => {
    try {
      downloadJsonFile(personas, 'personas.json');
      showToast('Personas downloaded successfully!', 'success');
    } catch (err) {
      console.error('Error downloading personas:', err);
      showToast('Failed to download personas.', 'error');
    }
  }, [personas, showToast]);

  const handleUploadPersonas = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      showToast('No file selected for upload.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        const uploadedPersonas = JSON.parse(jsonData);
        if (!Array.isArray(uploadedPersonas) || uploadedPersonas.length === 0) {
          showToast('Invalid file format or empty data.', 'error');
          return;
        }

        setIsLoading(true);
        const newPersonas = await importPersonasFromJson(uploadedPersonas);
        setPersonas(prev => [...prev, ...newPersonas]);
        showToast(`${newPersonas.length} personas uploaded successfully!`, 'success');
      } catch (err) {
        console.error('Error uploading personas:', err);
        showToast('Failed to upload personas. Check file format.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  }, [showToast]);

  // Filter personas based on criteria
  const filteredPersonas = useMemo(() => {
    return personas.filter(persona => {
      const nameMatch = filterName === '' || persona.name.toLowerCase().includes(filterName.toLowerCase());
      const demographicMatch = filterDemographic === '' || persona.demographics.toLowerCase().includes(filterDemographic.toLowerCase());
      const psychographicMatch = filterPsychographic === '' || persona.psychographics.toLowerCase().includes(filterPsychographic.toLowerCase());
      const rstProfileMatch = filterRstProfile === 'all' || 
        (filterRstProfile === 'bas-high' && persona.rstProfile?.bas === 'High') ||
        (filterRstProfile === 'bis-high' && persona.rstProfile?.bis === 'High') ||
        (filterRstProfile === 'fffs-high' && persona.rstProfile?.fffs === 'High');
      return nameMatch && demographicMatch && psychographicMatch && rstProfileMatch;
    });
  }, [personas, filterName, filterDemographic, filterPsychographic, filterRstProfile]);

  // Pagination logic for filtered personas
  const totalPages = useMemo(() => Math.ceil(filteredPersonas.length / itemsPerPage), [filteredPersonas.length, itemsPerPage]);
  const paginatedPersonas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPersonas.slice(startIndex, endIndex);
  }, [filteredPersonas, currentPage, itemsPerPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterName('');
    setFilterDemographic('');
    setFilterPsychographic('');
    setFilterRstProfile('all');
  }, []);

  return (
    <div className="p-8 bg-background min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <h2 className="text-5xl font-bold text-textPrimary mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Audience Modeling</h2>
        <p className="text-textSecondary text-xl mb-6 max-w-3xl mx-auto">
          Craft detailed personas to deeply understand and segment your audience for precision-targeted campaigns.
        </p>
        <img 
          src="/assets/audience-modeling-conceptual-diagram.png" 
          alt="Audience Modeling conceptual diagram: Audience Data -> Persona Builder -> Persona Card" 
          className="mx-auto mb-8 max-w-lg w-full h-auto rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300"
        />
      </motion.div>
      <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        {!showForm && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex gap-3"
          >
            <Button variant="primary" onClick={() => { setShowForm(true); setEditingPersona(undefined); setError(null); }} className="rounded-xl px-6 py-2">
              Create New Persona
            </Button>
            <Button variant="secondary" onClick={handleDownloadPersonas} disabled={personas.length === 0} className="rounded-xl px-6 py-2">
              Download Personas
            </Button>
            <Button variant="ghost" onClick={() => document.getElementById('uploadPersonas')?.click()} className="rounded-xl px-6 py-2">
              Upload Personas
            </Button>
            <input
              type="file"
              id="uploadPersonas"
              accept=".json"
              className="hidden"
              onChange={handleUploadPersonas}
            />
          </motion.div>
        )}
        {personas.length > 0 && (
          <div className="text-textSecondary text-sm bg-surface p-3 rounded-xl shadow-sm">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPersonas.length)} of {filteredPersonas.length} personas
          </div>
        )}
      </div>

      {error && !showForm && <Card className="mb-6 bg-red-100 border-l-4 border-danger text-danger p-4 rounded-xl"><p>{error}</p></Card>}
      
      {!showForm && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card title="Filter Personas" className="shadow-md rounded-2xl bg-surface border-border p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Input 
                label="Filter by Name" 
                value={filterName} 
                onChange={e => setFilterName(e.target.value)} 
                placeholder="Search by name..." 
                className="rounded-xl"
              />
              <Input 
                label="Filter by Demographic" 
                value={filterDemographic} 
                onChange={e => setFilterDemographic(e.target.value)} 
                placeholder="e.g., age, location..."
                className="rounded-xl"
              />
              <Input 
                label="Filter by Psychographic" 
                value={filterPsychographic} 
                onChange={e => setFilterPsychographic(e.target.value)} 
                placeholder="e.g., values, interests..."
                className="rounded-xl"
              />
              <Select 
                label="RST Profile (High)"
                value={filterRstProfile}
                onChange={e => setFilterRstProfile(e.target.value)}
                options={[
                  { value: 'all', label: 'All Profiles' },
                  { value: 'bas-high', label: 'BAS High (Reward-Driven)' },
                  { value: 'bis-high', label: 'BIS High (Risk-Averse)' },
                  { value: 'fffs-high', label: 'FFFS High (Fear-Driven)' }
                ]}
                containerClassName="mb-0"
              />
            </div>
            <div className="flex justify-end">
              <Button 
                variant="ghost" 
                onClick={handleClearFilters} 
                disabled={!filterName && !filterDemographic && !filterPsychographic && filterRstProfile === 'all'}
                className="rounded-xl"
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card title={editingPersona ? "Edit Persona" : "Create New Persona"} className="shadow-lg rounded-2xl bg-surface border-border p-6">
            <PersonaForm 
              initialPersona={editingPersona} 
              onSubmit={handleFormSubmit} 
              onCancel={() => { setShowForm(false); setEditingPersona(undefined); setError(null);}} 
              isLoading={isLoading} 
            />
          </Card>
        </motion.div>
      ) : (
        <>
          {personas.length === 0 && !isLoading && ( 
            <Card className="text-center shadow-md rounded-2xl bg-surface border-border p-6">
              <p className="text-textSecondary text-lg">No personas created yet.</p>
              <p className="text-textSecondary">Click "Create New Persona" to build one.</p>
            </Card>
          )}
          {isLoading && personas.length === 0 && <LoadingSpinner text="Loading personas..." />}
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPersonas.map((persona, index) => (
                <motion.div
                  key={persona.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="bg-surface rounded-2xl shadow-md border border-border hover:shadow-lg transition-shadow duration-300"
                >
                  <PersonaCard 
                    persona={persona} 
                    onEdit={handleEdit} 
                    onRefreshVulnerabilities={handleRefreshVulnerabilities} 
                    isRefreshingVulnerabilities={isLoading} 
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
          {filteredPersonas.length > 0 && (
            <div className="flex flex-col items-center mt-8 space-y-3">
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
