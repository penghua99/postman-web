import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { historyApi } from '@client/src/api';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { HistoryItem, HttpMethod } from '@shared/api.interface';
import { showConfirm } from '@lark-apaas/client-toolkit';

interface HistoryPanelProps {
  onSelectHistory: (history: HistoryItem) => void;
}

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'text-pm-method-get',
  POST: 'text-pm-method-post',
  PUT: 'text-pm-method-put',
  PATCH: 'text-pm-method-patch',
  DELETE: 'text-pm-method-delete',
  HEAD: 'text-pm-method-head',
  OPTIONS: 'text-pm-method-options',
};

const getStatusColor = (statusCode?: number): string => {
  if (!statusCode) return 'text-pm-fg-muted';
  if (statusCode >= 200 && statusCode < 300) return 'text-pm-method-get';
  if (statusCode >= 300 && statusCode < 400) return 'text-pm-method-put';
  if (statusCode >= 400 && statusCode < 500) return 'text-pm-method-post';
  if (statusCode >= 500) return 'text-pm-method-delete';
  return 'text-pm-fg-muted';
};

const getRelativeTime = (isoString: string): string => {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return date.toLocaleDateString('zh-CN');
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onSelectHistory }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);

  const loadHistory = async () => {
    try {
      const data = await historyApi.list(100);
      setItems(data.items);
    } catch (error) {
      logger.error('Failed to load history', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await historyApi.remove(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      logger.error('Failed to delete history item', error);
    }
  };

  const handleClear = async () => {
    if (!await showConfirm('Clear all history?')) return;
    try {
      await historyApi.clear();
      setItems([]);
    } catch (error) {
      logger.error('Failed to clear history', error);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-1 border-b border-pm-border px-3 py-2">
        <span className="text-xs font-medium text-pm-fg-primary">History</span>
        <button
          type="button"
          onClick={handleClear}
          className="text-[11px] text-pm-fg-muted hover:text-pm-method-delete"
          title="Clear history"
        >
          Clear all
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && (
          <div className="px-3 py-8 text-center text-xs text-pm-fg-muted">
            No history yet
          </div>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex cursor-pointer items-center gap-2 border-b border-pm-border/30 px-3 py-2 text-xs hover:bg-pm-bg-light"
            onClick={() => onSelectHistory(item)}
          >
            <span
              className={`w-12 shrink-0 truncate text-[11px] font-bold ${
                METHOD_COLORS[item.method]
              }`}
            >
              {item.method}
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-pm-fg-secondary">{item.url}</span>
              <span className="text-[10px] text-pm-fg-muted">
                {getRelativeTime(item.createdAt)}
              </span>
            </div>
            <span className={`shrink-0 text-[11px] ${getStatusColor(item.statusCode)}`}>
              {item.statusCode ?? '—'}
            </span>
            <button
              type="button"
              onClick={(e) => handleDelete(item.id, e)}
              className="p-0.5 text-pm-fg-muted opacity-0 group-hover:opacity-100 hover:text-pm-method-delete"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
