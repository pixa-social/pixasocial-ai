import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { LibraryPersona } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '../ui/Icons';
import { supabase } from '../../services/supabaseClient';

interface PersonaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (persona: LibraryPersona) => void;
  isMapping: boolean;
}

const ITEMS_PER_PAGE = 6;

// Debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export const PersonaLibraryModal: React.FC<PersonaLibraryModalProps> = ({ isOpen, onClose, onImport, isMapping }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [personas, setPersonas] = useState<LibraryPersona[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const fetchPersonas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query;

    // Use the RPC function for searching, otherwise a simple select for non-search
    if (debouncedSearchTerm) {
        query = supabase.rpc('search_personas', { search_term: debouncedSearchTerm })
                        .range(from, to)
                        .select('*', { count: 'exact' });
    } else {
        query = supabase.from('persona_library')
                        .select('*', { count: 'exact' })
                        .range(from, to);
    }

    const { data, error: dbError, count } = await query;
    
    if (dbError) {
      console.error("Error fetching library personas:", dbError);
      setError("Could not load personas from the library.");
    } else {
      setPersonas(data as LibraryPersona[] || []);
      setTotalCount(count || 0);
    }
    setIsLoading(false);
  }, [currentPage, debouncedSearchTerm]);

  useEffect(() => {
    if (isOpen) {
      fetchPersonas();
    }
  }, [fetchPersonas, isOpen]);
  
  // Reset page to 1 when search term changes
  useEffect(() => {
      setCurrentPage(1);
  }, [debouncedSearchTerm]);


  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <Card
        title="Import from Pixasocial Persona Library"
        className="w-full max-w-4xl bg-card shadow-xl rounded-lg transform transition-all duration-300 ease-in-out relative"
        shadow="xl"
      >
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 p-2"
          aria-label="Close"
        >
          <XMarkIcon className="w-6 h-6" />
        </Button>
        <div className="mt-4">
          <Input
            label="Search by name, occupation, or hobby"
            placeholder="e.g., Engineer, hiking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isMapping || isLoading}
          />
        </div>

        {isMapping && (
          <div className="absolute inset-0 bg-card/80 flex flex-col items-center justify-center z-20">
            <LoadingSpinner text="AI is mapping the persona..." />
            <p className="text-sm text-textSecondary mt-2">Please wait...</p>
          </div>
        )}

        <div className="mt-4 min-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner text="Fetching personas..." />
            </div>
          ) : error ? (
             <div className="text-center py-10 text-danger">
              <p>{error}</p>
              <Button onClick={fetchPersonas} variant="secondary" className="mt-2">Try Again</Button>
            </div>
          ) : personas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {personas.map((persona) => (
                <Card key={persona.id} className="p-4 flex flex-col justify-between" shadow="soft-md">
                  <div>
                    <h4 className="font-bold text-lg text-primary">{persona.name}</h4>
                    <p className="text-sm text-textSecondary">{persona.occupation}, Age {persona.age}</p>
                    <p className="text-xs text-textSecondary mt-2">
                      <strong className="text-textPrimary">Hobbies:</strong> {persona.hobbies.join(', ')}
                    </p>
                    <p className="text-xs text-textSecondary">
                      <strong className="text-textPrimary">Personality:</strong> {persona.personality}
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => onImport(persona)}
                    disabled={isMapping}
                  >
                    Import
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-textSecondary">
              <p>No personas found matching your search.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-lightBorder">
              <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isMapping || isLoading} variant="secondary" leftIcon={<ChevronLeftIcon className="w-4 h-4" />}>
                Previous
              </Button>
              <span className="text-sm text-textSecondary">
                Page {currentPage} of {totalPages}
              </span>
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isMapping || isLoading} variant="secondary" rightIcon={<ChevronRightIcon className="w-4 h-4" />}>
                Next
              </Button>
            </div>
          )}
      </Card>
    </div>
  );
};