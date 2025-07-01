import React, { useEffect, useCallback } from 'react';
import { ContentLibraryAsset } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '../ui/Icons';

interface ImageLightboxProps {
  images: ContentLibraryAsset[];
  startIndex: number;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, startIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = React.useState(startIndex);

  const handleNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') handleNext();
      if (event.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  if (!images || images.length === 0) return null;
  const currentImage = images[currentIndex];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[1001] p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close on backdrop click
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-image-name"
    >
      <div 
        className="relative max-w-4xl max-h-[90vh] bg-gray-800 p-2 rounded-lg shadow-2xl flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        <img 
          src={currentImage.dataUrl} 
          alt={currentImage.name} 
          className="max-w-full max-h-[calc(90vh-80px)] object-contain rounded" 
          id="lightbox-image-name"
        />
        <p className="text-white text-sm mt-2 text-center truncate w-full px-4" title={currentImage.name}>
            {currentImage.name} ({currentIndex + 1} / {images.length})
        </p>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-gray-700 hover:bg-gray-600 p-2 rounded-full transition-colors"
          aria-label="Close lightbox"
          title="Close (Esc)"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white bg-gray-700 bg-opacity-50 hover:bg-opacity-75 p-3 rounded-full transition-colors"
              aria-label="Previous image"
              title="Previous image (Left Arrow)"
            >
              <ChevronLeftIcon className="w-7 h-7" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white bg-gray-700 bg-opacity-50 hover:bg-opacity-75 p-3 rounded-full transition-colors"
              aria-label="Next image"
              title="Next image (Right Arrow)"
            >
              <ChevronRightIcon className="w-7 h-7" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};
