import { ChevronDown } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import type { HttpMethod } from '@shared/api.interface';

const METHODS: HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
];

const methodColorClass: Record<HttpMethod, string> = {
  GET: 'text-pm-method-get',
  POST: 'text-pm-method-post',
  PUT: 'text-pm-method-put',
  PATCH: 'text-pm-method-patch',
  DELETE: 'text-pm-method-delete',
  HEAD: 'text-pm-method-head',
  OPTIONS: 'text-pm-method-options',
};

interface MethodSelectorProps {
  method: HttpMethod;
  onChange: (method: HttpMethod) => void;
}

const MethodSelector: React.FC<MethodSelectorProps> = ({ method, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (m: HttpMethod) => {
    onChange(m);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 h-8 px-2 rounded-l border border-r-0 border-pm-border bg-pm-bg-dark text-sm font-bold ${methodColorClass[method]} hover:bg-pm-bg-light min-w-[88px] justify-between`}
      >
        <span>{method}</span>
        <ChevronDown size={14} className="text-pm-fg-muted" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-36 bg-pm-bg-dark border border-pm-border rounded shadow-lg z-50">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleSelect(m)}
              className={`w-full text-left px-3 py-1.5 text-sm font-bold hover:bg-pm-bg-light ${methodColorClass[m]} ${m === method ? 'bg-pm-bg-light' : ''}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MethodSelector;
