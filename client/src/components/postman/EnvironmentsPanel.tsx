import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit3, Star } from 'lucide-react';
import { environmentsApi } from '@client/src/api';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { EnvironmentItem, KeyValueParam } from '@shared/api.interface';
import { InlineEdit } from './InlineEdit';
import { showConfirm } from '@lark-apaas/client-toolkit';

interface VariableRowProps {
  variable: KeyValueParam;
  onChange: (field: keyof KeyValueParam, value: string | boolean) => void;
  onRemove: () => void;
}

const VariableRow: React.FC<VariableRowProps> = ({ variable, onChange, onRemove }) => (
  <div className="grid grid-cols-[1fr_1fr_40px] items-center gap-1">
    <input
      type="text"
      value={variable.key}
      onChange={(e) => onChange('key', e.target.value)}
      placeholder="key"
      className="w-full rounded border border-pm-border bg-pm-bg-mid px-2 py-1 text-xs text-pm-fg-primary outline-none focus:border-pm-orange"
    />
    <input
      type="text"
      value={variable.value}
      onChange={(e) => onChange('value', e.target.value)}
      placeholder="value"
      className="w-full rounded border border-pm-border bg-pm-bg-mid px-2 py-1 text-xs text-pm-fg-primary outline-none focus:border-pm-orange"
    />
    <div className="flex items-center justify-center gap-1">
      <input
        type="checkbox"
        checked={variable.enabled}
        onChange={(e) => onChange('enabled', e.target.checked)}
        className="h-3 w-3 cursor-pointer accent-pm-orange"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-pm-fg-muted hover:text-pm-method-delete"
      >
        <Trash2 size={12} />
      </button>
    </div>
  </div>
);

export const EnvironmentsPanel: React.FC = () => {
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [editingVars, setEditingVars] = useState<Record<string, KeyValueParam[]>>({});

  const loadEnvironments = async () => {
    try {
      setEnvironments(await environmentsApi.list());
    } catch (error) {
      logger.error('Failed to load environments', error);
    }
  };

  useEffect(() => {
    loadEnvironments();
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await environmentsApi.create({ name: newName.trim(), variables: [] });
      setNewName('');
      setCreating(false);
      await loadEnvironments();
    } catch (error) {
      logger.error('Failed to create environment', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await showConfirm('Delete this environment?')) return;
    try {
      await environmentsApi.remove(id);
      if (expandedId === id) setExpandedId(null);
      await loadEnvironments();
    } catch (error) {
      logger.error('Failed to delete environment', error);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await environmentsApi.setActive(id);
      await loadEnvironments();
    } catch (error) {
      logger.error('Failed to set active environment', error);
    }
  };

  const getVars = (env: EnvironmentItem): KeyValueParam[] =>
    editingVars[env.id] ?? env.variables ?? [];

  const handleVarChange = (envId: string, idx: number, field: keyof KeyValueParam, value: string | boolean) => {
    const env = environments.find((e) => e.id === envId);
    if (!env) return;
    const vars = [...getVars(env)];
    vars[idx] = { ...vars[idx], [field]: value } as KeyValueParam;
    setEditingVars((prev) => ({ ...prev, [envId]: vars }));
  };

  const handleAddVar = (envId: string) => {
    const env = environments.find((e) => e.id === envId);
    if (!env) return;
    setEditingVars((prev) => ({
      ...prev,
      [envId]: [...getVars(env), { key: '', value: '', enabled: true }],
    }));
  };

  const handleRemoveVar = (envId: string, index: number) => {
    const env = environments.find((e) => e.id === envId);
    if (!env) return;
    setEditingVars((prev) => ({
      ...prev,
      [envId]: getVars(env).filter((_, i) => i !== index),
    }));
  };

  const handleSaveVars = async (envId: string) => {
    try {
      const vars = editingVars[envId];
      if (vars) await environmentsApi.update(envId, { variables: vars });
      setEditingVars((prev) => {
        const next = { ...prev };
        delete next[envId];
        return next;
      });
      await loadEnvironments();
    } catch (error) {
      logger.error('Failed to save variables', error);
    }
  };

  const handleRenameConfirm = async (id: string, name: string) => {
    await environmentsApi.update(id, { name });
    setRenamingId(null);
    await loadEnvironments();
  };

  const toggleExpand = (env: EnvironmentItem) =>
    setExpandedId((prev) => (prev === env.id ? null : env.id));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-pm-border px-3 py-2">
        <span className="text-xs font-medium text-pm-fg-primary">Environments</span>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="p-1 text-pm-fg-muted hover:text-pm-fg-primary"
          title="New environment"
        >
          <Plus size={16} />
        </button>
      </div>

      {creating && (
        <div className="flex items-center gap-2 border-b border-pm-border px-3 py-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Environment name"
            autoFocus
            className="flex-1 rounded border border-pm-border bg-pm-bg-mid px-2 py-1 text-xs text-pm-fg-primary outline-none focus:border-pm-orange"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setCreating(false); setNewName(''); }
            }}
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={!newName.trim()}
            className="text-xs text-pm-method-get hover:text-pm-method-get/80"
          >✓</button>
          <button
            type="button"
            onClick={() => { setCreating(false); setNewName(''); }}
            className="text-xs text-pm-fg-muted hover:text-pm-fg-primary"
          >✕</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {environments.length === 0 && !creating && (
          <div className="px-3 py-8 text-center text-xs text-pm-fg-muted">
            No environments yet
          </div>
        )}
        {environments.map((env) => {
          const expanded = expandedId === env.id;
          const isRenaming = renamingId === env.id;
          const vars = getVars(env);
          const isDirty = editingVars[env.id] !== undefined;

          return (
            <div key={env.id} className="border-b border-pm-border/50">
              <div
                className="group flex h-8 cursor-pointer items-center gap-2 px-3 text-xs hover:bg-pm-bg-light"
                onClick={() => toggleExpand(env)}
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleSetActive(env.id); }}
                  className={`shrink-0 ${
                    env.isActive ? 'text-pm-orange' : 'text-pm-fg-muted hover:text-pm-fg-secondary'
                  }`}
                  title={env.isActive ? 'Active' : 'Set as active'}
                >
                  <Star size={14} fill={env.isActive ? 'currentColor' : 'none'} />
                </button>
                {isRenaming ? (
                  <div onClick={(e) => e.stopPropagation()} className="flex-1">
                    <InlineEdit
                      initialValue={env.name}
                      onSubmit={async (val) => handleRenameConfirm(env.id, val)}
                      onCancel={() => setRenamingId(null)}
                    />
                  </div>
                ) : (
                  <span className="flex-1 truncate text-pm-fg-secondary">{env.name}</span>
                )}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                  {!isRenaming && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setRenamingId(env.id); }}
                      className="p-0.5 text-pm-fg-muted hover:text-pm-fg-primary"
                      title="Rename"
                    >
                      <Edit3 size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleDelete(env.id); }}
                    className="p-0.5 text-pm-fg-muted hover:text-pm-method-delete"
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="bg-pm-bg-dark/50 px-3 py-2">
                  <div className="grid grid-cols-[1fr_1fr_40px] gap-1 pb-1 text-[10px] uppercase text-pm-fg-muted">
                    <span>Key</span>
                    <span>Value</span>
                    <span className="text-center">On</span>
                  </div>
                  <div className="space-y-1">
                    {vars.map((v, idx) => (
                      <VariableRow
                        key={idx}
                        variable={v}
                        onChange={(field, value) => handleVarChange(env.id, idx, field, value)}
                        onRemove={() => handleRemoveVar(env.id, idx)}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddVar(env.id)}
                      className="flex items-center gap-1 text-[11px] text-pm-fg-muted hover:text-pm-fg-secondary"
                    >
                      <Plus size={12} /> Add
                    </button>
                    {isDirty && (
                      <button
                        type="button"
                        onClick={() => handleSaveVars(env.id)}
                        className="ml-auto text-[11px] text-pm-method-get hover:text-pm-method-get/80"
                      >
                        Save
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
