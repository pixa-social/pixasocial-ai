import React from 'react';
import { ContentLibraryAsset } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input'; 
import { VideoCameraIcon, TrashIcon, TagIcon, PencilSquareIcon, CheckIcon, XMarkIcon, PhotoIcon } from '../ui/Icons';

interface AssetCardProps {
  asset: ContentLibraryAsset;
  isSelected: boolean;
  editingTagsForAssetId: string | null;
  currentEditingTags: string;
  onSelectAsset: (assetId: string) => void;
  onDeleteAsset: (assetId: string) => void;
  onStartEditTags: (asset: ContentLibraryAsset) => void;
  onSaveTags: (assetId: string) => void;
  onCancelEditTags: () => void;
  onCurrentEditingTagsChange: (tags: string) => void;
  onImageClick?: (assetId: string) => void; // Added for lightbox
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const AssetCardComponent: React.FC<AssetCardProps> = ({
  asset,
  isSelected,
  editingTagsForAssetId,
  currentEditingTags,
  onSelectAsset,
  onDeleteAsset,
  onStartEditTags,
  onSaveTags,
  onCancelEditTags,
  onCurrentEditingTagsChange,
  onImageClick,
}) => {
  const handleImagePreviewClick = () => {
    if (asset.type === 'image' && onImageClick) {
      onImageClick(asset.id);
    }
  };

  return (
    <Card className="flex flex-col overflow-hidden" shadow="soft-md">
      <div 
        className={`relative aspect-w-16 aspect-h-9 bg-gray-200 flex items-center justify-center group ${asset.type === 'image' && onImageClick ? 'cursor-pointer' : ''}`}
        onClick={handleImagePreviewClick}
        title={asset.type === 'image' && onImageClick ? `View ${asset.name}` : undefined}
      >
        <input
          type="checkbox"
          className="absolute top-2 left-2 h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded z-10 opacity-50 group-hover:opacity-100 transition-opacity"
          checked={isSelected}
          onChange={(e) => { e.stopPropagation(); onSelectAsset(asset.id); }} // Stop propagation for checkbox
          aria-label={`Select asset ${asset.name}`}
          onClick={(e) => e.stopPropagation()} // Prevent image click when checkbox clicked
        />
        {asset.type === 'image' ? (
          <img src={asset.dataUrl} alt={asset.name} className="object-contain max-h-40 w-full" />
        ) : (
          <div className="p-4 flex flex-col items-center justify-center text-center">
            <VideoCameraIcon className="w-16 h-16 text-secondary mb-2" />
            <p className="text-xs text-textSecondary">Video preview not available here.</p>
          </div>
        )}
      </div>
      <div className="p-3 flex-grow flex flex-col justify-between">
        <div>
          <h4 className="font-semibold text-textPrimary truncate" title={asset.name}>{asset.name}</h4>
          <p className="text-xs text-textSecondary capitalize">{asset.type} &bull; {formatBytes(asset.size)}</p>
          <p className="text-xs text-textSecondary">Uploaded: {new Date(asset.uploadedAt).toLocaleDateString()}</p>
          <div className="mt-1.5">
            {editingTagsForAssetId === asset.id ? (
              <div className="space-y-1.5">
                <Input
                  value={currentEditingTags}
                  onChange={(e) => onCurrentEditingTagsChange(e.target.value)}
                  placeholder="tag1, tag2, tag3"
                  className="text-xs py-1"
                  containerClassName="mb-0"
                  leftIcon={<TagIcon className="w-3 h-3 text-gray-400" />}
                />
                <div className="flex space-x-1.5">
                  <Button size="xs" variant="success" onClick={() => onSaveTags(asset.id)} className="p-1" leftIcon={<CheckIcon className="w-3 h-3" />} title="Save tags" />
                  <Button size="xs" variant="ghost" onClick={onCancelEditTags} className="p-1" leftIcon={<XMarkIcon className="w-3 h-3" />} title="Cancel editing tags"/>
                </div>
              </div>
            ) : (
              <>
                {(asset.tags && asset.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1 my-1.5">
                    {asset.tags.map(tag => (
                      <span key={tag} className="px-1.5 py-0.5 text-xxs bg-blue-100 text-blue-700 rounded-full font-medium">{tag}</span>
                    ))}
                  </div>
                )}
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onStartEditTags(asset)}
                  className="text-blue-600 hover:bg-blue-50 p-1"
                  leftIcon={<PencilSquareIcon className="w-3.5 h-3.5" />}
                  title={(asset.tags && asset.tags.length > 0) ? 'Edit Tags' : 'Add Tags'}
                >
                  {(asset.tags && asset.tags.length > 0) ? 'Edit Tags' : 'Add Tags'}
                </Button>
              </>
            )}
          </div>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => onDeleteAsset(asset.id)}
          leftIcon={<TrashIcon className="w-4 h-4" />}
          className="w-full mt-3"
          title={`Delete ${asset.name}`}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
};

export const AssetCard = React.memo(AssetCardComponent);

if (!document.getElementById('pixasocial-cl-assetcard-text-xxs-style')) {
    const style = document.createElement('style');
    style.id = 'pixasocial-cl-assetcard-text-xxs-style';
    style.innerHTML = `
      .text-xxs {
        font-size: 0.65rem; 
        line-height: 0.8rem;
      }
    `;
    document.head.appendChild(style);
  }
