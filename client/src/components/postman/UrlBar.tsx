import { Send } from 'lucide-react';
import type { HttpMethod } from '@shared/api.interface';
import MethodSelector from './MethodSelector';

interface UrlBarProps {
  method: HttpMethod;
  url: string;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
  loading?: boolean;
}

const UrlBar: React.FC<UrlBarProps> = ({
  method,
  url,
  onMethodChange,
  onUrlChange,
  onSend,
  loading = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex items-center gap-0 w-full">
      <MethodSelector method={method} onChange={onMethodChange} />
      <input
        type="text"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter request URL"
        className="flex-1 h-8 px-3 bg-pm-bg-dark border border-pm-border text-pm-fg-primary text-sm focus:border-pm-orange focus:outline-none placeholder:text-pm-fg-muted"
      />
      <button
        type="button"
        onClick={onSend}
        disabled={loading}
        className="h-8 px-4 bg-pm-orange hover:bg-pm-orange-hover text-white text-sm font-medium rounded-r flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send size={14} />
        Send
      </button>
    </div>
  );
};

export default UrlBar;
