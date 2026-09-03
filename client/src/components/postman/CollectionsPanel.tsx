import { useEffect, useState, useRef } from 'react';
import { Plus, Download, Upload, Check, X } from 'lucide-react';
import { collectionsApi, requestsApi } from '@client/src/api';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  CollectionTreeItem,
  RequestItem,
  HttpMethod,
  ExportCollectionResponse,
} from '@shared/api.interface';
import { CollectionTree } from './CollectionTree';
import { showConfirm } from '@lark-apaas/client-toolkit';

interface CollectionsPanelProps {
  onSelectRequest: (request: RequestItem) => void;
}

export const CollectionsPanel: React.FC<CollectionsPanelProps> = ({ onSelectRequest }) => {
  const [collections, setCollections] = useState<CollectionTreeItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCollections = async () => {
    try {
      const data = await collectionsApi.list();
      setCollections(data);
    } catch (error) {
      logger.error('Failed to load collections', error);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateCollection = async () => {
    if (!newName.trim()) return;
    try {
      const created = await collectionsApi.create({ name: newName.trim() });
      setCollections((prev) => [...prev, created]);
      setExpandedIds((prev) => new Set(prev).add(created.id));
      setNewName('');
      setCreating(false);
    } catch (error) {
      logger.error('Failed to create collection', error);
    }
  };

  const handleRenameCollection = async (id: string, name: string) => {
    await collectionsApi.update(id, { name });
    await loadCollections();
  };

  const handleDeleteCollection = async (id: string) => {
    if (!await showConfirm('Delete this collection?')) return;
    try {
      await collectionsApi.remove(id);
      await loadCollections();
    } catch (error) {
      logger.error('Failed to delete collection', error);
    }
  };

  const handleAddFolder = async (parentId: string, name: string) => {
    await collectionsApi.create({ name, parentId, isFolder: true });
    await loadCollections();
  };

  const handleAddRequest = async (parentId: string, name: string) => {
    await requestsApi.create({
      name,
      method: 'GET' as HttpMethod,
      url: '',
      parentId,
    });
    await loadCollections();
  };

  const handleRenameRequest = async (id: string, name: string) => {
    await requestsApi.update(id, { name });
    await loadCollections();
  };

  const handleDeleteRequest = async (id: string) => {
    if (!await showConfirm('Delete this request?')) return;
    try {
      await requestsApi.remove(id);
      await loadCollections();
    } catch (error) {
      logger.error('Failed to delete request', error);
    }
  };

  const handleExport = async (id: string) => {
    try {
      const data: ExportCollectionResponse = await collectionsApi.exportCollection(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.collection.name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error('Failed to export collection', error);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await collectionsApi.importCollection(data);
      await loadCollections();
    } catch (error) {
      logger.error('Failed to import collection', error);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-1 border-b border-pm-border px-3 py-2">
        <span className="text-xs font-medium text-pm-fg-primary">Collections</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="p-1 text-pm-fg-muted hover:text-pm-fg-primary"
            title="New collection"
          >
            <Plus size={16} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1 text-pm-fg-muted hover:text-pm-fg-primary"
            title="Import collection"
          >
            <Upload size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* Create inline form */}
      {creating && (
        <div className="flex items-center gap-2 border-b border-pm-border px-3 py-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Collection name"
            autoFocus
            className="flex-1 rounded border border-pm-border bg-pm-bg-mid px-2 py-1 text-xs text-pm-fg-primary outline-none focus:border-pm-orange"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateCollection();
              if (e.key === 'Escape') {
                setCreating(false);
                setNewName('');
              }
            }}
          />
          <button
            type="button"
            onClick={handleCreateCollection}
            disabled={!newName.trim()}
            className="p-1 text-pm-method-get hover:text-pm-method-get/80"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setCreating(false);
              setNewName('');
            }}
            className="p-1 text-pm-fg-muted hover:text-pm-fg-primary"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {collections.length === 0 && !creating && (
          <div className="px-3 py-8 text-center text-xs text-pm-fg-muted">
            No collections yet
          </div>
        )}
        <CollectionTree
          items={collections}
          expandedIds={expandedIds}
          onToggleExpand={handleToggleExpand}
          onSelectRequest={onSelectRequest}
          onRenameCollection={handleRenameCollection}
          onDeleteCollection={handleDeleteCollection}
          onAddFolder={handleAddFolder}
          onAddRequest={handleAddRequest}
          onRenameRequest={handleRenameRequest}
          onDeleteRequest={handleDeleteRequest}
          onExportCollection={handleExport}
        />
      </div>

      {/* Footer - export hint */}
      <div className="border-t border-pm-border px-3 py-2 text-[11px] text-pm-fg-muted">
        Hover items for actions · Export via context
      </div>
    </div>
  );
};
