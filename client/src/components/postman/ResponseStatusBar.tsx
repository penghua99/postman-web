import { Clock, HardDrive } from 'lucide-react';
import { formatSize } from './jsonFormatter';

interface ResponseStatusBarProps {
  status: number;
  statusText: string;
  responseTime: number;
  responseSize: number;
}

const getStatusColor = (status: number): string => {
  if (status === 0) return 'text-gray-400';
  if (status >= 200 && status < 300) return 'text-green-400';
  if (status >= 300 && status < 400) return 'text-blue-400';
  if (status >= 400 && status < 500) return 'text-amber-400';
  if (status >= 500) return 'text-red-400';
  return 'text-gray-400';
};

const ResponseStatusBar: React.FC<ResponseStatusBarProps> = ({
  status,
  statusText,
  responseTime,
  responseSize,
}) => {
  return (
    <div className="flex items-center gap-4 px-3 py-2 border-b border-pm-border bg-pm-bg-mid">
      <div className="flex items-center gap-2">
        <span
          className={`font-bold text-lg ${getStatusColor(status)}`}
          data-testid="status-code"
        >
          {status}
        </span>
        <span className="text-sm text-pm-fg-secondary">
          {statusText || (status === 0 ? 'Error' : '')}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-pm-fg-secondary">
        <Clock size={14} className="text-pm-fg-muted" />
        <span>{responseTime} ms</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm text-pm-fg-secondary">
        <HardDrive size={14} className="text-pm-fg-muted" />
        <span>{formatSize(responseSize)}</span>
      </div>
    </div>
  );
};

export default ResponseStatusBar;
