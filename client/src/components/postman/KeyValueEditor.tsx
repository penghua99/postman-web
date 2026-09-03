import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export interface KeyValueItem {
  key: string;
  value: string;
  enabled: boolean;
}

interface KeyValueEditorProps {
  items: KeyValueItem[];
  onChange: (items: KeyValueItem[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  items,
  onChange,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleAdd = () => {
    onChange([...items, { key: '', value: '', enabled: true }]);
  };

  const handleRemove = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onChange(newItems);
  };

  const handleChange = (
    index: number,
    field: 'key' | 'value' | 'enabled',
    value: string | boolean,
  ) => {
    const newItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    );
    onChange(newItems);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-[40px_1fr_1fr_40px] text-xs text-pm-fg-muted px-2 py-1.5 border-b border-pm-border bg-pm-bg-dark">
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="accent-pm-orange"
            checked={items.length > 0 && items.every((i) => i.enabled)}
            onChange={(e) => {
              const checked = e.target.checked;
              onChange(items.map((item) => ({ ...item, enabled: checked })));
            }}
          />
        </div>
        <div className="font-medium">Key</div>
        <div className="font-medium">Value</div>
        <div></div>
      </div>
      <div>
        {items.length === 0 && (
          <div className="px-4 py-6 text-sm text-pm-fg-muted text-center">
            No items yet. Click &quot;+ Add&quot; to add one.
          </div>
        )}
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-[40px_1fr_1fr_40px] items-center border-b border-pm-border hover:bg-pm-bg-dark"
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                className="accent-pm-orange"
                checked={item.enabled}
                onChange={(e) =>
                  handleChange(index, 'enabled', e.target.checked)
                }
              />
            </div>
            <input
              type="text"
              value={item.key}
              onChange={(e) => handleChange(index, 'key', e.target.value)}
              placeholder={keyPlaceholder}
              className={`w-full h-8 px-2 bg-transparent text-sm focus:outline-none ${
                item.enabled
                  ? 'text-pm-fg-primary'
                  : 'text-pm-fg-muted line-through'
              }`}
            />
            <input
              type="text"
              value={item.value}
              onChange={(e) => handleChange(index, 'value', e.target.value)}
              placeholder={valuePlaceholder}
              className={`w-full h-8 px-2 bg-transparent text-sm focus:outline-none ${
                item.enabled
                  ? 'text-pm-fg-primary'
                  : 'text-pm-fg-muted line-through'
              }`}
            />
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className={`p-1 rounded transition-opacity ${
                  hoverIndex === index
                    ? 'opacity-100 text-pm-fg-muted hover:text-pm-method-delete'
                    : 'opacity-0'
                }`}
                aria-label="Remove row"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-2">
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 px-2 py-1 text-sm text-pm-fg-secondary hover:text-pm-fg-primary rounded hover:bg-pm-bg-light"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
    </div>
  );
};

export default KeyValueEditor;
