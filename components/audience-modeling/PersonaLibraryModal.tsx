import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { AdminPersona } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from '../ui/Icons';

interface PersonaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (persona: AdminPersona) => void;
  isMapping: boolean;
  adminPersonas: AdminPersona[];
}

const ITEMS_PER_PAGE = 6;

export const PersonaLibraryModal: React.FC<PersonaLibraryModalProps> = ({ isOpen, onClose, onImport, isMapping, adminPersonas }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const filteredPersonas = useMemo(() => {
    if (!searchTerm) return adminPersonas;
    return adminPersonas.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.demographics?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.psychographics?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [adminPersonas, searchTerm]);

  const totalPages = Math.ceil(filteredPersonas.length / ITEMS_PER_PAGE);
  const paginatedPersonas = useMemo(() => {
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPersonas.slice(from, from + ITEMS_PER_PAGE);
  }, [filteredPersonas, currentPage]);

  useEffect(() => {
    setCurrentPage(1); // Reset page when search term changes
  }, [searchTerm]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ease-in-out">
      <Card
        title="Import from Template Library"
        className="w-full max-w-4xl bg-card shadow-xl rounded-lg transform transition-all duration-300 ease-in-out relative"
        shadow="xl"
      >
        <Button onClick={onClose} variant="ghost" size="sm" className="absolute top-4 right-4 p-2" aria-label="Close"><XMarkIcon className="w-6 h-6" /></Button>
        <div className="mt-4">
          <Input
            label="Search by name or description"
            placeholder="e.g., Tech Enthusiast, Eco-conscious..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isMapping}
            leftIcon={<SearchIcon className="w-4 h-4 text-muted-foreground"/>}
          />
        </div>

        {isMapping && (
          <div className="absolute inset-0 bg-card/80 flex flex-col items-center justify-center z-20 rounded-lg">
            <LoadingSpinner text="Preparing persona..." />
            <p className="text-sm text-textSecondary mt-2">Please wait...</p>
          </div>
        )}

        <div className="mt-4 min-h-[400px]">
          {paginatedPersonas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPersonas.map((persona) => (
                <Card key={persona.id} className="p-4 flex flex-col justify-between" shadow="soft-md">
                  <div>
                    <h4 className="font-bold text-lg text-primary">{persona.name}</h4>
                    <p className="text-sm text-textSecondary line-clamp-3">{persona.demographics}</p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => onImport(persona)}
                    disabled={isMapping}
                  >
                    Import Template
                  </Button>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-textSecondary">
              <p>No template personas found matching your search.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
            <div className="mt-6 flex justify-between items-center pt-4 border-t border-lightBorder">
              <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1 || isMapping} variant="secondary" leftIcon={<ChevronLeftIcon className="w-4 h-4" />}>
                Previous
              </Button>
              <span className="text-sm text-textSecondary">
                Page {currentPage} of {totalPages}
              </span>
              <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || isMapping} variant="secondary" rightIcon={<ChevronRightIcon className="w-4 h-4" />}>
                Next
              </Button>
            </div>
          )}
      </Card>
    </div>
  );
};