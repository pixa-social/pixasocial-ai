import React from 'react';
import { ViewName, NavItem } from '../../types';
import { NAVIGATION_ITEMS } from '../../constants';
import { ChevronRightIcon } from './Icons';

interface BreadcrumbsProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

interface BreadcrumbItem {
  label: string;
  viewName?: ViewName;
  isCurrent: boolean;
}

const findBreadcrumbPath = (
  items: NavItem[],
  currentView: ViewName,
  currentPath: BreadcrumbItem[] = []
): BreadcrumbItem[] | null => {
  for (const item of items) {
    const newPath = [...currentPath, { label: item.label, viewName: item.viewName, isCurrent: false }];
    if (item.viewName === currentView) {
      newPath[newPath.length - 1].isCurrent = true;
      return newPath;
    }
    if (item.children) {
      const childPath = findBreadcrumbPath(item.children, currentView, newPath);
      if (childPath) {
        return childPath;
      }
    }
  }
  return null;
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = React.memo(({ currentView, onNavigate }) => {
  const path = findBreadcrumbPath(NAVIGATION_ITEMS, currentView);

  // If we are on the dashboard, don't show any breadcrumbs as it's the root.
  // This simplifies the UI.
  if (currentView === ViewName.Dashboard || !path) {
    return null; 
  }

  // Always add Dashboard as the first, clickable home link.
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: ViewName.Dashboard, viewName: ViewName.Dashboard, isCurrent: false },
    ...path,
  ];
  
  // Clean up potential duplicate 'Dashboard' entries if it's the first item in the path.
  if (breadcrumbItems.length > 1 && breadcrumbItems[1].label === ViewName.Dashboard) {
    breadcrumbItems.shift(); 
  }

  return (
    <nav aria-label="Breadcrumb" className="mb-6 px-4 py-2.5 bg-card border-b border-lightBorder shadow-sm">
      <ol className="flex items-center space-x-1.5 text-sm text-textSecondary">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
            )}
            {item.isCurrent || !item.viewName ? (
              <span className="font-medium text-textPrimary" aria-current={item.isCurrent ? 'page' : undefined}>
                {item.label}
              </span>
            ) : (
              <button
                onClick={() => item.viewName && onNavigate(item.viewName)}
                className="hover:text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-primary rounded"
                aria-label={`Go to ${item.label}`}
              >
                {item.label}
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
});
