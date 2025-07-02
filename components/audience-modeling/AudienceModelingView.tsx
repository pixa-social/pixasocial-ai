import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Persona, ViewName } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { generateJson } from '../../services/aiService';
import { useToast } from '../ui/ToastProvider';
import { PrerequisiteMessageCard } from '../ui/PrerequisiteMessageCard';
import { useNavigateToView } from '../../hooks/useNavigateToView';
import { PersonaCard } from './PersonaCard';
import { PersonaForm } from './PersonaForm';
import { fetchPersonas, savePersona, updatePersona, deletePersona, importPersonasFromJson } from '../../services/personaService';
import { downloadJsonFile } from '../../utils/fileUtils';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Pagination logic
  const totalPages = useMemo(() => Math.ceil(personas.length / itemsPerPage), [personas.length, itemsPerPage]);
  const paginatedPersonas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return personas.slice(startIndex, endIndex);
  }, [personas, currentPage, itemsPerPage]);

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
        <h2 className="text-4xl font-bold text-textPrimary mb-2">Audience Modeling</h2>
        <p className="text-textSecondary text-lg mb-4">
          Build detailed personas to understand and segment your audience for targeted campaigns.
        </p>
        <img 
          src="/assets/audience-modeling-conceptual-diagram.png" 
          alt="Audience Modeling conceptual diagram: Audience Data -> Persona Builder -> Persona Card" 
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
            <Button variant="primary" onClick={() => { setShowForm(true); setEditingPersona(undefined); setError(null); }}>
              Create New Persona
            </Button>
            <Button variant="secondary" onClick={handleDownloadPersonas} disabled={personas.length === 0}>
              Download Personas
            </Button>
            <Button variant="ghost" onClick={() => document.getElementById('uploadPersonas')?.click()}>
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
          <div className="text-textSecondary text-sm">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, personas.length)} of {personas.length} personas
          </div>
        )}
      </div>

      {error && !showForm && <Card className="mb-4 bg-red-100 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}
      
      {showForm ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card title={editingPersona ? "Edit Persona" : "Create New Persona"} className="shadow-md rounded-2xl bg-surface border-border">
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
            <Card className="text-center shadow-md rounded-2xl bg-surface border-border">
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
          {personas.length > 0 && (
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
