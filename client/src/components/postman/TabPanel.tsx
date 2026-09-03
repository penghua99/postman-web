import { useState } from 'react';
import type { ReactNode } from 'react';

export type TabKey =
  | 'params'
  | 'headers'
  | 'body'
  | 'auth'
  | 'pre-request'
  | 'tests';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'params', label: 'Params' },
  { key: 'headers', label: 'Headers' },
  { key: 'body', label: 'Body' },
  { key: 'auth', label: 'Auth' },
  { key: 'pre-request', label: 'Pre-request Script' },
  { key: 'tests', label: 'Tests' },
];

interface TabPanelProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  const [hoverTab] = useState<TabKey | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-pm-border bg-pm-bg-mid">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-2 text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'text-pm-fg-primary border-pm-orange'
                : 'text-pm-fg-secondary border-transparent hover:text-pm-fg-primary'
            } ${hoverTab === tab.key ? 'text-pm-fg-primary' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
};

export default TabPanel;
