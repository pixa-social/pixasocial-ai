
import React from 'react';

export const ContentLibrarySkeleton: React.FC = () => {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-10 bg-gray-300 rounded w-3/4 mb-6"></div> {/* Title Skeleton */}
      
      {/* Upload Card Skeleton */}
      <div className="bg-gray-200 rounded-xl p-6 mb-8">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-300 rounded"></div> {/* Input Skeleton */}
          <div className="h-10 bg-gray-300 rounded"></div> {/* Input Skeleton */}
          <div className="h-12 bg-gray-300 rounded"></div> {/* File Input Skeleton */}
          <div className="h-10 bg-gray-400 rounded w-1/4"></div> {/* Button Skeleton */}
        </div>
      </div>

      {/* Filter Card Skeleton */}
      <div className="bg-gray-200 rounded-xl p-6 mb-8">
        <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="h-10 bg-gray-300 rounded"></div> {/* Input Skeleton */}
          <div className="h-10 bg-gray-300 rounded"></div> {/* Input Skeleton */}
          <div className="h-10 bg-gray-300 rounded"></div> {/* Select Skeleton */}
        </div>
        <div className="h-8 bg-gray-300 rounded"></div> {/* Bulk Actions Bar Skeleton */}
      </div>

      {/* Assets Grid Skeleton */}
      <div className="bg-gray-200 rounded-xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-32 bg-gray-300 rounded"></div> {/* Image preview skeleton */}
              <div className="h-4 bg-gray-300 rounded w-3/4"></div> {/* Title skeleton */}
              <div className="h-3 bg-gray-300 rounded w-1/2"></div> {/* Sub-info skeleton */}
              <div className="h-8 bg-gray-400 rounded"></div> {/* Button skeleton */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
