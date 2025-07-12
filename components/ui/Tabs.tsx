
import React, { useState, Children, isValidElement, cloneElement } from 'react';

interface TabProps {
  label: string;
  icon?: React.ReactNode;
  children?: React.ReactNode; // Content for the tab panel
  className?: string;
}

// This component is just for defining tab structure, it doesn't render anything itself.
export const Tab: React.FC<TabProps> = ({ children }) => <>{children}</>;

interface TabsProps {
  children: React.ReactNode; // Expects <Tab> components as children
  defaultActiveTab?: number;
  className?: string;
  tabListClassName?: string;
  tabButtonClassName?: string;
  activeTabButtonClassName?: string;
  tabPanelClassName?: string;
  onTabChange?: (index: number) => void;
}

export const Tabs: React.FC<TabsProps> = ({
  children,
  defaultActiveTab = 0,
  className = '',
  tabListClassName = '',
  tabButtonClassName = '',
  activeTabButtonClassName = '',
  tabPanelClassName = '',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  const tabs = Children.toArray(children).filter(
    (child): child is React.ReactElement<TabProps> => isValidElement(child) && child.type === Tab
  );

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    if (onTabChange) {
      onTabChange(index);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`mb-4 border-b border-gray-200 dark:border-gray-700 ${tabListClassName}`}>
        <ul className="-mb-px flex flex-wrap text-sm font-medium text-center" role="tablist">
          {tabs.map((tab, index) => (
            <li key={index} className="mr-2" role="presentation">
              <button
                className={`inline-flex items-center justify-center p-3 sm:p-4 border-b-2 rounded-t-lg group
                  ${activeTab === index
                    ? `text-primary border-primary ${activeTabButtonClassName}`
                    : `border-transparent text-textSecondary hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 ${tabButtonClassName}`
                  }
                `}
                onClick={() => handleTabClick(index)}
                role="tab"
                aria-controls={`tab-panel-${index}`}
                aria-selected={activeTab === index}
                type="button"
              >
                {tab.props.icon && <span className="mr-2">{tab.props.icon}</span>}
                {tab.props.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        {tabs.map((tab, index) => (
          <div
            key={index}
            className={`${tabPanelClassName} ${activeTab === index ? 'block' : 'hidden'}`}
            role="tabpanel"
            id={`tab-panel-${index}`}
            aria-labelledby={`tab-button-${index}`}
          >
            {tab.props.children}
          </div>
        ))}
      </div>
    </div>
  );
};
