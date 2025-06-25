
import React, { useState, useCallback, useRef } from 'react';
import { ContentLibraryAsset } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ArrowUpTrayIcon, PhotoIcon, TrashIcon, VideoCameraIcon, ExclamationTriangleIcon } from './ui/Icons';
import { useToast } from './ui/ToastProvider';
import { MAX_FILE_UPLOAD_SIZE_BYTES, MAX_FILE_UPLOAD_SIZE_MB, ACCEPTED_MEDIA_TYPES, ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES } from '../constants';

interface ContentLibraryViewProps {
  assets: ContentLibraryAsset[];
  onAddAsset: (asset: ContentLibraryAsset) => void;
  onRemoveAsset: (assetId: string) => void;
}

// Helper to format file size
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const ContentLibraryView: React.FC<ContentLibraryViewProps> = ({ assets, onAddAsset, onRemoveAsset }) => {
  const { showToast } = useToast();
  const [assetName, setAssetName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!ACCEPTED_MEDIA_TYPES.includes(file.type)) {
        showToast(`Unsupported file type: ${file.type}. Please upload images (JPEG, PNG, GIF, WEBP) or videos (MP4, WEBM).`, 'error');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      if (file.size > MAX_FILE_UPLOAD_SIZE_BYTES) {
        showToast(`File is too large (${formatBytes(file.size)}). Maximum size is ${MAX_FILE_UPLOAD_SIZE_MB}MB.`, 'error');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      setSelectedFile(file);
      if (!assetName) { // Auto-fill asset name if empty
        setAssetName(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
      }
    }
  };

  const handleUpload = useCallback(async () => {
    if (!selectedFile || !assetName.trim()) {
      showToast('Please select a file and provide a name for the asset.', 'error');
      return;
    }
    setIsLoading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const newAsset: ContentLibraryAsset = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        name: assetName.trim(),
        type: selectedFile.type.startsWith('image/') ? 'image' : 'video',
        dataUrl: reader.result as string,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        size: selectedFile.size,
        uploadedAt: new Date().toISOString(),
      };
      onAddAsset(newAsset); // Toast is handled by onAddAsset in App.tsx
      setAssetName('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
      setIsLoading(false);
    };
    reader.onerror = () => {
      showToast('Failed to read file.', 'error');
      setIsLoading(false);
    };
    reader.readAsDataURL(selectedFile);
  }, [selectedFile, assetName, onAddAsset, showToast]);

  const handleDeleteAsset = (assetId: string) => {
    if (window.confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
        onRemoveAsset(assetId); // Toast is handled by onRemoveAsset in App.tsx
    }
  };

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
                Selected: {selectedFile.name} ({formatBytes(selectedFile.size)})
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
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
           <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700">
                Uploaded media is stored in your browser's local storage. Large files or many uploads can impact performance and storage limits.
            </p>
           </div>
        </div>
      </Card>

      <Card title="Stored Assets" shadow="soft-lg">
        {isLoading && assets.length === 0 && <LoadingSpinner text="Loading assets..." />}
        {!isLoading && assets.length === 0 && (
          <p className="text-textSecondary text-center py-4">
            No media uploaded yet. Use the form above to add assets to your library.
          </p>
        )}
        {assets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {assets.slice().sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()).map((asset) => (
              <Card key={asset.id} className="flex flex-col overflow-hidden" shadow="soft-md">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 flex items-center justify-center">
                  {asset.type === 'image' ? (
                    <img src={asset.dataUrl} alt={asset.name} className="object-contain max-h-40 w-full" />
                  ) : (
                    <div className="p-4 flex flex-col items-center justify-center text-center">
                        <VideoCameraIcon className="w-16 h-16 text-secondary mb-2" />
                        <p className="text-xs text-textSecondary">Video preview not available here. <br/> Use browser controls if opened directly.</p>
                         {/* Basic video player for direct display - might be too heavy for many items
                         <video controls src={asset.dataUrl} className="max-h-40 w-full object-contain">
                            Your browser does not support the video tag.
                         </video>
                         */}
                    </div>
                  )}
                </div>
                <div className="p-3 flex-grow flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-textPrimary truncate" title={asset.name}>{asset.name}</h4>
                    <p className="text-xs text-textSecondary capitalize">{asset.type} &bull; {formatBytes(asset.size)}</p>
                    <p className="text-xs text-textSecondary">Uploaded: {new Date(asset.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteAsset(asset.id)}
                    leftIcon={<TrashIcon className="w-4 h-4" />}
                    className="w-full mt-3"
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
