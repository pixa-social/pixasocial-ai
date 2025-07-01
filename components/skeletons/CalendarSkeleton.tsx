import React from 'react';

export const CalendarSkeleton: React.FC = () => {
  return (
    <div className="p-2 md:p-4 animate-pulse">
      <div className="h-8 bg-gray-300 rounded w-1/2 mb-6 ml-2 md:ml-0"></div> {/* Title Skeleton */}
      <div className="bg-gray-200 rounded-lg p-2 md:p-4">
        {/* Toolbar Skeleton */}
        <div className="mb-4 p-3 flex flex-col md:flex-row justify-between items-center bg-gray-300 rounded-t-lg">
          <div className="flex items-center space-x-1 sm:space-x-2 mb-2 md:mb-0">
            <div className="h-8 w-16 bg-gray-400 rounded"></div>
            <div className="h-8 w-20 bg-gray-400 rounded"></div>
            <div className="h-8 w-16 bg-gray-400 rounded"></div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 mb-2 md:mb-0">
            <div className="h-6 w-20 bg-gray-400 rounded"></div>
            <div className="h-8 w-32 bg-gray-400 rounded"></div>
          </div>
          <div className="h-6 w-32 bg-gray-400 rounded hidden sm:block"></div>
          <div className="flex space-x-1 sm:space-x-2">
            <div className="h-8 w-16 bg-gray-400 rounded"></div>
            <div className="h-8 w-16 bg-gray-400 rounded"></div>
          </div>
        </div>
        {/* Calendar Grid Skeleton */}
        <div className="h-[calc(100vh-20rem)] bg-gray-300 rounded-b-lg"></div>
      </div>
    </div>
  );
};
