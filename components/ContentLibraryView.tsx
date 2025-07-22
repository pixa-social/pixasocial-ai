import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { ContentLibraryAsset } from '../../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { 
    ArrowUpTrayIcon, TrashIcon, TagIcon, PhotoIcon
} from './ui/Icons'; 
import { useToast } from './ui/ToastProvider';
import { MAX_FILE_UPLOAD_SIZE_BYTES, MAX_FILE_UPLOAD_SIZE_MB, ACCEPTED_MEDIA_TYPES } from '../constants';
import { AssetCard } from './content-library/AssetCard'; 
import { ContentLibrarySkeleton } from './skeletons/ContentLibrarySkeleton';
import { ImageLightbox } from './content-library/ImageLightbox';
import { useAppDataContext } from './MainAppLayout';
import { EmptyState } from './ui/EmptyState';

export const ContentLibraryView: React.FC = () => {
  const { contentLibraryAssets: assets, handlers } = useAppDataContext();
  const { addAsset: onAddAsset, updateAsset: onUpdateAsset, removeAsset: onRemoveAsset } = handlers;

  const { showToast } = useToast();
  const [assetName, setAssetName] = useState('');
  const [assetTags, setAssetTags] = useState(''); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false); // General loading for uploads
  const [isInitialLoading, setIsInitialLoading] = useState(true); // For skeleton
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [filterTag, setFilterTag] = useState('');
  const [filterName, setFilterName] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [editingTagsForAssetId, setEditingTagsForAssetId] = useState<string | null>(null);
  const [currentEditingTags, setCurrentEditingTags] = useState('');

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentLightboxImageIndex, setCurrentLightboxImageIndex] = useState(0);

  useEffect(() => {
    // Simulate initial data load for skeleton display
    const timer = setTimeout(() => setIsInitialLoading(false), 750);
    return () => clearTimeout(timer);
  }, []);


  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_MEDIA_TYPES.includes(file.type)) {
        showToast(`Unsupported file type: ${file.type}. Please upload images (JPEG, PNG, GIF, WEBP) or videos (MP4, WEBM).`, 'error');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (file.size > MAX_FILE_UPLOAD_SIZE_BYTES) {
        showToast(`File is too large (${(file.size / (1024*1024)).toFixed(2)}MB). Maximum size is ${MAX_FILE_UPLOAD_SIZE_MB}MB.`, 'error');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      if (!assetName) {
        setAssetName(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
      }
    }
  }, [showToast, assetName]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !assetName.trim()) {
      showToast('Please select a file and provide a name for the asset.', 'error');
      return;
    }
    setIsLoading(true);
    await onAddAsset(selectedFile, assetName, assetTags.split(',').map(t => t.trim()).filter(Boolean));
    setAssetName('');
    setAssetTags('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsLoading(false);
  }, [selectedFile, assetName, assetTags, onAddAsset, showToast]);

  const handleDeleteAsset = useCallback(async (asset: ContentLibraryAsset) => {
    if (window.confirm('Are you sure you want to delete this asset? This action is permanent.')) {
      await onRemoveAsset(asset.id, asset.storage_path);
      setSelectedAssetIds(prev => prev.filter(id => id !== asset.id)); 
    }
  }, [onRemoveAsset]);
  
  const handleStartEditTags = useCallback((asset: ContentLibraryAsset) => {
    setEditingTagsForAssetId(asset.id);
    setCurrentEditingTags((asset.tags || []).join(', '));
  }, []);

  const handleCancelEditTags = useCallback(() => {
    setEditingTagsForAssetId(null);
    setCurrentEditingTags('');
  }, []);

  const handleSaveTags = useCallback(async (assetId: string) => {
    const assetToUpdate = assets.find(a => a.id === assetId);
    if (assetToUpdate) {
      const updatedTags = currentEditingTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await onUpdateAsset(assetId, { tags: updatedTags });
      setEditingTagsForAssetId(null);
      setCurrentEditingTags('');
    }
  }, [assets, currentEditingTags, onUpdateAsset]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const typeMatch = filterType === 'all' || asset.type === filterType;
      const nameMatch = filterName === '' || asset.name.toLowerCase().includes(filterName.toLowerCase());
      const tagMatch = filterTag === '' || (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase())));
      return typeMatch && nameMatch && tagMatch;
    }).sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
  }, [assets, filterType, filterName, filterTag]);

  const imageAssetsForLightbox = useMemo(() => filteredAssets.filter(asset => asset.type === 'image'), [filteredAssets]);

  const handleImageClick = useCallback((assetId: string) => {
    const clickedImageIndex = imageAssetsForLightbox.findIndex(asset => asset.id === assetId);
    if (clickedImageIndex !== -1) {
      setCurrentLightboxImageIndex(clickedImageIndex);
      setIsLightboxOpen(true);
    }
  }, [imageAssetsForLightbox]);

  const handleSelectAsset = useCallback((assetId: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(assetId) ? prev.filter(id => id !== assetId) : [...prev, assetId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedAssetIds.length === filteredAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssets.map(asset => asset.id));
    }
  }, [selectedAssetIds, filteredAssets]);
  
  const handleDeleteSelected = useCallback(async () => {
    if (selectedAssetIds.length === 0) {
        showToast("No assets selected for deletion.", "info");
        return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedAssetIds.length} selected asset(s)? This action is permanent.`)) {
        const assetsToDelete = assets.filter(a => selectedAssetIds.includes(a.id));
        await Promise.all(assetsToDelete.map(asset => onRemoveAsset(asset.id, asset.storage_path)));
        setSelectedAssetIds([]);
    }
  }, [selectedAssetIds, assets, onRemoveAsset, showToast]);
  
  const handleCurrentEditingTagsChange = useCallback((tags: string) => {
    setCurrentEditingTags(tags);
  }, []);

  if (isInitialLoading && assets.length === 0) {
    return <ContentLibrarySkeleton />;
  }

  return (
    <div className="p-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-6">Content Library</h2>

      <Card title="Upload New Media" className="mb-8" shadow="soft-lg">
        <div className="space-y-4">
          <Input
            label="Asset Name / Title"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="e.g., Summer Campaign Banner"
            required
          />
          <Input
            label="Tags (comma-separated)"
            value={assetTags}
            onChange={(e) => setAssetTags(e.target.value)}
            placeholder="e.g., summer24, banner, promo"
            leftIcon={<TagIcon className="w-4 h-4 text-gray-400" />}
          />
          <div>
            <label htmlFor="media-upload" className="block text-sm font-medium text-textSecondary mb-1">
              Select Media File (Max {MAX_FILE_UPLOAD_SIZE_MB}MB)
            </label>
            <input
              id="media-upload"
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MEDIA_TYPES.join(',')}
              onChange={handleFileChange}
              className="block w-full text-sm text-textSecondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-700 cursor-pointer"
            />
            {selectedFile && (
              <p className="text-xs text-textSecondary mt-1">
                Selected: {selectedFile.name} ({(selectedFile.size / (1024*1024)).toFixed(2)}MB)
              </p>
            )}
          </div>
          <Button
            variant="primary"
            onClick={handleUpload}
            isLoading={isLoading}
            disabled={!selectedFile || !assetName.trim() || isLoading}
            leftIcon={<ArrowUpTrayIcon className="w-5 h-5" />}
          >
            {isLoading ? 'Uploading...' : 'Upload to Library'}
          </Button>
        </div>
      </Card>

      <Card title="Filter & Manage Assets" className="mb-8" shadow="soft-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input 
            label="Filter by Name" 
            value={filterName} 
            onChange={e => setFilterName(e.target.value)} 
            placeholder="Search by name..." 
          />
          <Input 
            label="Filter by Tag" 
            value={filterTag} 
            onChange={e => setFilterTag(e.target.value)} 
            placeholder="Search by tag..."
            leftIcon={<TagIcon className="w-4 h-4 text-gray-400" />}
          />
          <div>
            <label className="block text-sm font-medium text-textSecondary mb-1">Filter by Type</label>
            <div className="flex space-x-2">
              {(['all', 'image', 'video'] as const).map(type => (
                <Button 
                  key={type} 
                  size="sm" 
                  variant={filterType === type ? 'primary' : 'outline'} 
                  onClick={() => setFilterType(type)}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-lightBorder">
            <div className="flex items-center">
                <input
                    type="checkbox"
                    id="select-all-assets"
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded mr-2"
                    checked={filteredAssets.length > 0 && selectedAssetIds.length === filteredAssets.length}
                    onChange={handleSelectAll}
                    disabled={filteredAssets.length === 0}
                    aria-label="Select all filtered assets"
                />
                <label htmlFor="select-all-assets" className="text-sm text-textSecondary">
                    Select All ({selectedAssetIds.length} / {filteredAssets.length} selected)
                </label>
            </div>
            <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => {setFilterType('all'); setFilterName(''); setFilterTag(''); setSelectedAssetIds([]);}} disabled={!filterName && !filterTag && filterType === 'all'}>
                    Clear Filters
                </Button>
                {selectedAssetIds.length > 0 && (
                    <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={handleDeleteSelected}
                        leftIcon={<TrashIcon className="w-4 h-4" />}
                    >
                        Delete Selected ({selectedAssetIds.length})
                    </Button>
                )}
            </div>
        </div>
      </Card>


      <Card title={`Showing ${filteredAssets.length} Assets`} shadow="soft-lg">
        {isLoading && assets.length === 0 && !isInitialLoading && <LoadingSpinner text="Loading assets..." />}
        {!isInitialLoading && assets.length === 0 && (
           <EmptyState
            icon={<PhotoIcon className="w-8 h-8 text-primary" />}
            title="Your Content Library is Empty"
            description="Upload images and videos using the form above to start building your collection of reusable media assets for your campaigns."
          />
        )}
        {!isInitialLoading && assets.length > 0 && filteredAssets.length === 0 && (
            <p className="text-textSecondary text-center py-4">
                No assets match your current filters. Try adjusting or clearing filters.
            </p>
        )}
        {filteredAssets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                isSelected={selectedAssetIds.includes(asset.id)}
                editingTagsForAssetId={editingTagsForAssetId}
                currentEditingTags={currentEditingTags}
                onSelectAsset={handleSelectAsset}
                onDeleteAsset={handleDeleteAsset}
                onStartEditTags={handleStartEditTags}
                onSaveTags={handleSaveTags}
                onCancelEditTags={handleCancelEditTags}
                onCurrentEditingTagsChange={handleCurrentEditingTagsChange}
                onImageClick={handleImageClick} 
              />
            ))}
          </div>
        )}
      </Card>
      {isLightboxOpen && (
        <ImageLightbox
          images={imageAssetsForLightbox}
          startIndex={currentLightboxImageIndex}
          onClose={() => setIsLightboxOpen(false)}
        />
      )}
    </div>
  );
};