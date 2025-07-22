import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ViewName, NavItem } from '../../types';
import { NAVIGATION_ITEMS, VIEW_PATH_MAP } from '../../constants';
import { ChevronRightIcon } from './Icons';

interface BreadcrumbItem {
  label: string;
  path?: string;
  isCurrent: boolean;
}

const findBreadcrumbPath = (
  items: NavItem[],
  pathname: string,
  currentPath: BreadcrumbItem[] = []
): BreadcrumbItem[] | null => {
  for (const item of items) {
    const itemPath = item.viewName ? VIEW_PATH_MAP[item.viewName] : undefined;
    const newPath = [...currentPath, { label: item.label, path: itemPath, isCurrent: false }];
    
    if (itemPath === pathname) {
      newPath[newPath.length - 1].isCurrent = true;
      return newPath;
    }
    if (item.children) {
      const childPath = findBreadcrumbPath(item.children, pathname, newPath);
      if (childPath) {
        return childPath;
      }
    }
  }
  return null;
};

export const Breadcrumbs: React.FC = React.memo(() => {
  const location = useLocation();
  const path = findBreadcrumbPath(NAVIGATION_ITEMS, location.pathname);

  if (location.pathname === VIEW_PATH_MAP.Dashboard || !path) {
    return null; 
  }

  const breadcrumbItems: BreadcrumbItem[] = [
    { label: ViewName.Dashboard, path: VIEW_PATH_MAP.Dashboard, isCurrent: false },
    ...path,
  ];
  
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
            {item.isCurrent || !item.path ? (
              <span className="font-medium text-textPrimary" aria-current={item.isCurrent ? 'page' : undefined}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-primary hover:underline focus:outline-none focus:ring-1 focus:ring-primary rounded"
                aria-label={`Go to ${item.label}`}
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
});