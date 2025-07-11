import React from 'react';
import { Card } from '../ui/Card';

export const SocialPosterSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/2 mb-6"></div> {/* Title Skeleton */}

      {/* Tabs Skeleton */}
      <div className="flex space-x-4 border-b border-lightBorder mb-6">
        <div className="h-10 bg-card rounded-t-lg w-24"></div>
        <div className="h-10 bg-card rounded-t-lg w-24"></div>
        <div className="h-10 bg-card rounded-t-lg w-24"></div>
      </div>

      {/* Post Cards Skeleton */}
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-gray-700 rounded-full"></div> {/* Platform Icon */}
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div> {/* Content Line 1 */}
                <div className="h-4 bg-gray-600 rounded w-1/2"></div> {/* Content Line 2 */}
                <div className="flex justify-between items-center mt-2">
                  <div className="h-4 bg-gray-600 rounded w-1/4"></div> {/* Persona/Op info */}
                  <div className="h-4 bg-gray-600 rounded w-1/4"></div> {/* Date info */}
                </div>
              </div>
              <div className="w-24 h-8 bg-gray-700 rounded"></div> {/* Status Badge */}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
