import { useState } from 'react';
import type { RequestItem, HistoryItem } from '@shared/api.interface';
import { CollectionsPanel } from './CollectionsPanel';
import { EnvironmentsPanel } from './EnvironmentsPanel';
import { HistoryPanel } from './HistoryPanel';

type TabKey = 'collections' | 'environments' | 'history';

interface SidebarProps {
  onSelectRequest: (request: RequestItem) => void;
  onSelectHistory: (history: HistoryItem) => void;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'collections', label: 'Collections' },
  { key: 'environments', label: 'Environments' },
  { key: 'history', label: 'History' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onSelectRequest, onSelectHistory }) => {
  const [activeTab, setActiveTab] = useState<TabKey>('collections');

  return (
    <div className="flex h-full w-[280px] flex-col border-r border-pm-border bg-pm-bg-darkest">
      {/* Tabs */}
      <div className="flex border-b border-pm-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex-1 px-2 py-3 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-pm-fg-primary'
                : 'text-pm-fg-muted hover:text-pm-fg-secondary'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-pm-orange" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'collections' && (
          <CollectionsPanel onSelectRequest={onSelectRequest} />
        )}
        {activeTab === 'environments' && <EnvironmentsPanel />}
        {activeTab === 'history' && (
          <HistoryPanel onSelectHistory={onSelectHistory} />
        )}
      </div>
    </div>
  );
};
