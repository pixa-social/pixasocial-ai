import React, { useState, useMemo } from 'react';
import { ContentLibraryAsset } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { XMarkIcon, SearchIcon, CheckCircleIcon } from '../ui/Icons';
import { LoadingSpinner } from '../ui/LoadingSpinner';


const ModalAssetCard: React.FC<{
  asset: ContentLibraryAsset;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ asset, isSelected, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className={`relative group border-2 rounded-lg overflow-hidden cursor-pointer h-32 transition-all duration-200 ${isSelected ? 'border-primary ring-2 ring-primary' : 'border-border hover:border-primary/50'}`}
    >
      {asset.publicUrl ? 
        <img src={asset.publicUrl} alt={asset.name} className="w-full h-full object-cover" />
      : <div className="w-full h-full bg-muted flex items-center justify-center"><LoadingSpinner size="sm" /></div>
      }
      <div className={`absolute inset-0 bg-black/60 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {isSelected &&
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <CheckCircleIcon className="w-8 h-8 text-white" />
          </div>
        }
      </div>
      <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate" title={asset.name}>{asset.name}</p>
    </div>
  );
};


interface ContentLibrarySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: ContentLibraryAsset[]) => void;
  multiSelect: boolean;
  allAssets: ContentLibraryAsset[];
}

export const ContentLibrarySelectionModal: React.FC<ContentLibrarySelectionModalProps> = ({
  isOpen, onClose, onSelect, multiSelect, allAssets
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');

  const filteredAssets = useMemo(() => {
    return allAssets.filter(asset => {
      const typeMatch = filterType === 'all' || asset.type === filterType;
      const nameMatch = searchTerm === '' || asset.name.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && nameMatch;
    });
  }, [allAssets, searchTerm, filterType]);

  const handleSelectAsset = (assetId: string) => {
    if (multiSelect) {
      setSelectedIds(prev => prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]);
    } else {
      setSelectedIds([assetId]);
    }
  };

  const handleConfirm = () => {
    const selectedAssets = allAssets.filter(asset => selectedIds.includes(asset.id));
    onSelect(selectedAssets);
    setSelectedIds([]); // Reset for next time
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-[100] flex items-center justify-center p-4">
      <Card
        title="Select from Content Library"
        className="w-full max-w-4xl bg-card shadow-xl rounded-lg flex flex-col h-[90vh]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><XMarkIcon className="w-6 h-6" /></button>

        <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            leftIcon={<SearchIcon className="w-4 h-4" />}
            containerClassName="mb-0 flex-grow"
          />
          <div className="flex items-center gap-2">
            {(['all', 'image', 'video'] as const).map(type => (
              <Button key={type} size="sm" variant={filterType === type ? 'primary' : 'outline'} onClick={() => setFilterType(type)}>{type.charAt(0).toUpperCase() + type.slice(1)}s</Button>
            ))}
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {filteredAssets.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredAssets.map(asset => (
                <ModalAssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedIds.includes(asset.id)}
                  onSelect={() => handleSelectAsset(asset.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No assets found.</p>
          )}
        </div>

        <div className="p-4 border-t border-border flex justify-end items-center gap-3">
          <p className="text-sm text-muted-foreground mr-auto">{selectedIds.length} asset(s) selected</p>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={selectedIds.length === 0}>Confirm Selection</Button>
        </div>
      </Card>
    </div>
  );
};
