import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface InlineEditProps {
  initialValue: string;
  placeholder?: string;
  onSubmit: (value: string) => Promise<void>;
  onCancel: () => void;
  inputClassName?: string;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  initialValue,
  placeholder,
  onSubmit,
  onCancel,
  inputClassName,
}) => {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit(value.trim());
    } catch {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 items-center gap-1">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className={`flex-1 rounded border border-pm-border bg-pm-bg-mid px-2 py-1 text-xs text-pm-fg-primary outline-none focus:border-pm-orange ${
          inputClassName ?? ''
        }`}
      />
      <button
        type="submit"
        disabled={saving || !value.trim()}
        className="p-1 text-pm-fg-muted hover:text-pm-fg-primary"
      >
        <Check size={14} />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 text-pm-fg-muted hover:text-pm-fg-primary"
      >
        <X size={14} />
      </button>
    </form>
  );
};
