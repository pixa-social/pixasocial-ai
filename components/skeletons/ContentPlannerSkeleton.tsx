import React from 'react';

export const ContentPlannerSkeleton: React.FC = () => {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-10 bg-gray-300 rounded w-1/2 mb-6"></div> {/* Title Skeleton */}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Config Panel Skeleton */}
        <div className="md:col-span-1 bg-gray-200 rounded-xl p-6 space-y-4">
          <div className="h-6 bg-gray-300 rounded w-3/4"></div> {/* Card Title */}
          {[...Array(5)].map((_, i) => (
            <div key={`config-item-${i}`} className="space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/2"></div> {/* Label */}
              <div className="h-10 bg-gray-300 rounded"></div> {/* Input/Select */}
            </div>
          ))}
          <div className="h-4 bg-gray-300 rounded w-1/2 mt-4"></div> {/* Platform Select Label */}
          <div className="space-y-2">
             {[...Array(3)].map((_, i) => (
                <div key={`platform-checkbox-skeleton-${i}`} className="h-8 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="h-12 bg-gray-400 rounded mt-6"></div> {/* Generate Button */}
        </div>

        {/* Content Cards Area Skeleton */}
        <div className="md:col-span-2 space-y-6">
          {[...Array(2)].map((_, i) => (
            <div key={`content-card-skeleton-${i}`} className="bg-gray-200 rounded-xl p-6">
              <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div> {/* Card Title */}
              <div className="space-y-3">
                <div className="h-4 bg-gray-300 rounded w-full"></div>
                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-20 bg-gray-300 rounded mt-2"></div> {/* Image Placeholder */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
