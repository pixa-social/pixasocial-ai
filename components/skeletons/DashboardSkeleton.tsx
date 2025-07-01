import React from 'react';
import { Card } from '../ui/Card'; // Assuming Card can be used for structure

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-pulse">
      <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>

      {/* Summary Metrics Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-200 rounded-xl p-4 h-28"></div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-gray-200 rounded-xl p-6 h-24">
        <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Scheduled Posts Skeleton */}
        <div className="lg:col-span-2 bg-gray-200 rounded-xl p-6 h-96">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="h-10 bg-gray-300 rounded mt-4"></div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="bg-gray-200 rounded-xl p-6 h-96">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
