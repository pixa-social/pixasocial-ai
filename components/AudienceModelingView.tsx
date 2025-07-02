import React, { useState, useEffect, useCallback } from 'react';
import { Persona } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { PersonaCard } from './audience-modeling/PersonaCard';
import { PersonaForm } from './audience-modeling/PersonaForm';
import { generateJson } from '../services/aiService';
import { useToast } from './ui/ToastProvider';
import { fetchPersonas, savePersona, updatePersona, deletePersona, importPersonasFromJson } from '../services/personaService';

export const AudienceModelingView: React.FC = () => {
  const { showToast } = useToast();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>(undefined);
  const [isRefreshingVulnerabilities, setIsRefreshingVulnerabilities] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const personasPerPage = 6;

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

  const handleAddPersona = useCallback(async (persona: Omit<Persona, 'id' | 'avatarUrl'> & { vulnerabilities?: string[]; rstProfile?: any }) => {
    setIsLoading(true);
    setError(null);
    try {
      const newPersona = await savePersona(persona);
      setPersonas(prev => [...prev, newPersona]);
      setShowForm(false);
      showToast('Persona created successfully!', 'success');
    } catch (err) {
      setError('Failed to save persona to Pixasocial.');
      console.error(err);
      showToast('Failed to create persona.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleUpdatePersona = useCallback(async (persona: Persona & { vulnerabilities?: string[]; rstProfile?: any }) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedPersona = await updatePersona(persona.id, persona);
      setPersonas(prev => prev.map(p => (p.id === persona.id ? updatedPersona : p)));
      setShowForm(false);
      setEditingPersona(undefined);
      showToast('Persona updated successfully!', 'success');
    } catch (err) {
      setError('Failed to update persona on Pixasocial.');
      console.error(err);
      showToast('Failed to update persona.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const handleDeletePersona = useCallback(async (id: string) => {
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

  const handleEditPersona = useCallback((persona: Persona) => {
    setEditingPersona(persona);
    setShowForm(true);
    setError(null);
  }, []);

  const handleRefreshVulnerabilities = useCallback(async (persona: Persona) => {
    setIsRefreshingVulnerabilities(true);
    setError(null);
    try {
      const prompt = `Analyze this persona for potential vulnerabilities to influence campaigns. Persona details:
      - Name: ${persona.name}
      - Demographics: ${persona.demographics}
      - Psychographics: ${persona.psychographics}
      - Initial Beliefs: ${persona.initialBeliefs}
      - RST Profile: BAS: ${persona.rstProfile?.bas || 'N/A'}, BIS: ${persona.rstProfile?.bis || 'N/A'}, FFFS: ${persona.rstProfile?.fffs || 'N/A'}
      
      Return a JSON array of 3-5 specific vulnerabilities as strings. Example: ["Fear of missing out on trends", "Susceptible to authority figures", ...]`;
      const systemInstruction = "You are an expert in audience analysis. Identify psychological vulnerabilities for influence based on persona data. Return JSON only.";
      
      interface VulnerabilityResponse {
        vulnerabilities: string[];
      }
      
      const result = await generateJson<VulnerabilityResponse>(prompt, systemInstruction);
      if (result.data && Array.isArray(result.data.vulnerabilities)) {
        const updatedPersona = await updatePersona(persona.id, { ...persona, vulnerabilities: result.data.vulnerabilities });
        setPersonas(prev => prev.map(p => (p.id === persona.id ? updatedPersona : p)));
        showToast(`Updated vulnerabilities for ${persona.name} using AI!`, 'success');
      } else {
        setError(result.error || 'AI analysis failed or returned invalid data.');
        showToast('AI analysis failed.', 'error');
      }
    } catch (err) {
      setError('Failed to refresh vulnerabilities.');
      console.error(err);
      showToast('Failed to refresh vulnerabilities.', 'error');
    } finally {
      setIsRefreshingVulnerabilities(false);
    }
  }, [showToast]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      showToast('No file selected.', 'error');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          if (!text) {
            throw new Error('File is empty or unreadable.');
          }
          const jsonData = JSON.parse(text);
          if (!Array.isArray(jsonData)) {
            showToast('Invalid JSON format. Expected an array of personas.', 'error');
            setIsLoading(false);
            return;
          }
          
          const importedPersonas = await importPersonasFromJson(jsonData);
          setPersonas(prev => [...prev, ...importedPersonas]);
          showToast(`Imported ${importedPersonas.length} personas from JSON!`, 'success');
        } catch (err) {
          setError('Failed to parse JSON or import personas to Pixasocial.');
          console.error('JSON Parse or Import Error:', err);
          showToast('Failed to import personas from JSON. Please check the file format.', 'error');
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        throw new Error('Error reading the file.');
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Failed to read file.');
      console.error('File Read Error:', err);
      showToast('Failed to read file.', 'error');
      setIsLoading(false);
    }
  }, [showToast]);

  const handleDownloadPersonas = useCallback(() => {
    const personasJson = JSON.stringify(personas, null, 2);
    const blob = new Blob([personasJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personas_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Personas downloaded successfully!', 'success');
  }, [personas, showToast]);

  // Pagination logic
  const totalPages = Math.ceil(personas.length / personasPerPage);
  const paginatedPersonas = personas.slice((currentPage - 1) * personasPerPage, currentPage * personasPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 bg-background">
      <div className="relative text-center mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-20 rounded-full h-24 w-24 mx-auto -mt-12 blur-xl"></div>
        <h2 className="text-4xl font-bold text-textPrimary mb-2 relative z-10">Audience Modeling</h2>
        <p className="text-textSecondary mb-6 max-w-2xl mx-auto">
          Create detailed personas representing audience segments. Use AI to analyze vulnerabilities and tailor influence strategies.
        </p>
        <img 
          src="/assets/rst-profile-explanation.png" 
          alt="RST Profile Explanation: BAS (Behavioral Approach System), BIS (Behavioral Inhibition System), FFFS (Fight-Flight-Freeze System)" 
          className="mx-auto mb-6 max-w-lg w-full h-auto rounded-lg shadow-md transform transition-transform duration-500 hover:scale-105"
          onError={(e) => console.error('Failed to load RST image:', e)}
        />
      </div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        {!showForm && (
          <div className="flex space-x-3 flex-wrap gap-2">
            <Button variant="primary" onClick={() => { setShowForm(true); setEditingPersona(undefined); setError(null); }}>Create Persona</Button>
            <Button variant="secondary" onClick={() => document.getElementById('uploadJson')?.click()}>
              Upload Personas (JSON)
            </Button>
            <Button variant="ghost" onClick={handleDownloadPersonas} disabled={personas.length === 0}>
              Download Personas (JSON)
            </Button>
            <input
              type="file"
              id="uploadJson"
              accept=".json"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}
        {personas.length > 0 && !showForm && (
          <div className="flex items-center space-x-2 bg-surface p-2 rounded-lg shadow-sm">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === currentPage ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handlePageChange(page)}
                className="w-10 h-10"
              >
                {page}
              </Button>
            ))}
          </div>
        )}
      </div>

      {error && !showForm && <Card className="mb-4 bg-red-100 border-l-4 border-danger text-danger p-4"><p>{error}</p></Card>}
      
      {showForm ? (
        <Card title={editingPersona ? "Edit Persona" : "Create New Persona"} className="shadow-lg animate-fade-in">
          <PersonaForm 
            initialPersona={editingPersona} 
            onSubmit={editingPersona ? handleUpdatePersona : handleAddPersona} 
            onCancel={() => { setShowForm(false); setEditingPersona(undefined); setError(null); }} 
            isLoading={isLoading} 
          />
        </Card>
      ) : (
        <>
          {isLoading && personas.length === 0 && <LoadingSpinner text="Loading personas..." />}
          {!isLoading && personas.length === 0 && (
            <Card className="text-center shadow-lg p-8 animate-fade-in">
              <p className="text-textSecondary text-lg">No personas created yet.</p>
              <p className="text-textSecondary">Click "Create Persona" or upload a JSON file to get started.</p>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPersonas.map((persona, index) => (
              <div key={persona.id} className="transform transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <PersonaCard
                  persona={persona}
                  onEdit={handleEditPersona}
                  onRefreshVulnerabilities={handleRefreshVulnerabilities}
                  isRefreshingVulnerabilities={isRefreshingVulnerabilities}
                />
              </div>
            ))}
          </div>
          {personas.length > 0 && (
            <div className="flex justify-center mt-6">
              <div className="flex items-center space-x-2 bg-surface p-2 rounded-lg shadow-sm">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className="w-10 h-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
