import { useState } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit3,
  FilePlus,
  FolderPlus,
  Download,
} from 'lucide-react';
import type {
  CollectionTreeItem,
  RequestItem,
  HttpMethod,
} from '@shared/api.interface';
import { InlineEdit } from './InlineEdit';

interface CollectionTreeProps {
  items: CollectionTreeItem[];
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelectRequest: (request: RequestItem) => void;
  onRenameCollection: (id: string, name: string) => Promise<void>;
  onDeleteCollection: (id: string) => Promise<void>;
  onAddFolder: (parentId: string, name: string) => Promise<void>;
  onAddRequest: (parentId: string, name: string) => Promise<void>;
  onRenameRequest: (id: string, name: string) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
  onExportCollection?: (id: string) => void;
  depth?: number;
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

interface RequestRowProps {
  request: RequestItem;
  depth: number;
  onSelect: (r: RequestItem) => void;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const RequestRow: React.FC<RequestRowProps> = ({
  request,
  depth,
  onSelect,
  onRename,
  onDelete,
}) => {
  const [editing, setEditing] = useState(false);
  const [hover, setHover] = useState(false);

  return (
    <div
      className="group flex h-7 cursor-pointer items-center gap-1 pr-2 text-xs hover:bg-pm-bg-light"
      style={{ paddingLeft: `${depth * 16 + 24}px` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => !editing && onSelect(request)}
    >
      <span className={`w-10 shrink-0 text-[11px] font-bold ${METHOD_COLORS[request.method]}`}>
        {request.method}
      </span>
      {editing ? (
        <InlineEdit
          initialValue={request.name}
          placeholder="Request name"
          onSubmit={async (val) => {
            await onRename(request.id, val);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <span className="flex-1 truncate text-pm-fg-secondary">{request.name}</span>
      )}
      {hover && !editing && (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="p-0.5 text-pm-fg-muted hover:text-pm-fg-primary"
            title="Rename"
          >
            <Edit3 size={12} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(request.id)}
            className="p-0.5 text-pm-fg-muted hover:text-pm-method-delete"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export const CollectionTree: React.FC<CollectionTreeProps> = ({
  items,
  expandedIds,
  onToggleExpand,
  onSelectRequest,
  onRenameCollection,
  onDeleteCollection,
  onAddFolder,
  onAddRequest,
  onRenameRequest,
  onDeleteRequest,
  onExportCollection,
  depth = 0,
}) => {
  const [addingFolder, setAddingFolder] = useState<string | null>(null);
  const [addingRequest, setAddingRequest] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  return (
    <div>
      {items.map((item) => {
        const expanded = expandedIds.has(item.id);
        const isEditing = editingId === item.id;
        const isHovered = hoverId === item.id;

        return (
          <div key={item.id}>
            <div
              className="group flex h-7 cursor-pointer items-center gap-1 pr-2 text-xs hover:bg-pm-bg-light"
              style={{ paddingLeft: `${depth * 16 + 4}px` }}
              onMouseEnter={() => setHoverId(item.id)}
              onMouseLeave={() => setHoverId(null)}
              onClick={() => onToggleExpand(item.id)}
            >
              <span className="flex w-4 shrink-0 items-center justify-center text-pm-fg-muted">
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
              <span className="text-pm-fg-muted">
                {expanded ? <FolderOpen size={14} /> : <Folder size={14} />}
              </span>
              {isEditing ? (
                <div onClick={(e) => e.stopPropagation()}>
                  <InlineEdit
                    initialValue={item.name}
                    placeholder="Name"
                    onSubmit={async (val) => {
                      await onRenameCollection(item.id, val);
                      setEditingId(null);
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <span className="flex-1 truncate text-pm-fg-secondary">{item.name}</span>
              )}
              {isHovered && !isEditing && (
                <div
                  className="flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAddingRequest(item.id);
                      if (!expanded) onToggleExpand(item.id);
                    }}
                    className="p-0.5 text-pm-fg-muted hover:text-pm-fg-primary"
                    title="Add request"
                  >
                    <FilePlus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingFolder(item.id);
                      if (!expanded) onToggleExpand(item.id);
                    }}
                    className="p-0.5 text-pm-fg-muted hover:text-pm-fg-primary"
                    title="Add folder"
                  >
                    <FolderPlus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(item.id)}
                    className="p-0.5 text-pm-fg-muted hover:text-pm-fg-primary"
                    title="Rename"
                  >
                    <Edit3 size={12} />
                  </button>
                  {onExportCollection && depth === 0 && (
                    <button
                      type="button"
                      onClick={() => onExportCollection(item.id)}
                      className="p-0.5 text-pm-fg-muted hover:text-pm-fg-primary"
                      title="Export"
                    >
                      <Download size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteCollection(item.id)}
                    className="p-0.5 text-pm-fg-muted hover:text-pm-method-delete"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>

            {expanded && addingRequest === item.id && (
              <div
                className="flex h-7 items-center gap-1 pr-2"
                style={{ paddingLeft: `${depth * 16 + 28}px` }}
              >
                <InlineEdit
                  initialValue=""
                  placeholder="New request"
                  onSubmit={async (val) => {
                    await onAddRequest(item.id, val);
                    setAddingRequest(null);
                  }}
                  onCancel={() => setAddingRequest(null)}
                />
              </div>
            )}

            {expanded && addingFolder === item.id && (
              <div
                className="flex h-7 items-center gap-1 pr-2"
                style={{ paddingLeft: `${depth * 16 + 28}px` }}
              >
                <InlineEdit
                  initialValue=""
                  placeholder="New folder"
                  onSubmit={async (val) => {
                    await onAddFolder(item.id, val);
                    setAddingFolder(null);
                  }}
                  onCancel={() => setAddingFolder(null)}
                />
              </div>
            )}

            {expanded && (
              <>
                <CollectionTree
                  items={item.children}
                  expandedIds={expandedIds}
                  onToggleExpand={onToggleExpand}
                  onSelectRequest={onSelectRequest}
                  onRenameCollection={onRenameCollection}
                  onDeleteCollection={onDeleteCollection}
                  onAddFolder={onAddFolder}
                  onAddRequest={onAddRequest}
                  onRenameRequest={onRenameRequest}
                  onDeleteRequest={onDeleteRequest}
                  onExportCollection={onExportCollection}
                  depth={depth + 1}
                />
                {item.requests.map((req) => (
                  <RequestRow
                    key={req.id}
                    request={req}
                    depth={depth + 1}
                    onSelect={onSelectRequest}
                    onRename={onRenameRequest}
                    onDelete={onDeleteRequest}
                  />
                ))}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
