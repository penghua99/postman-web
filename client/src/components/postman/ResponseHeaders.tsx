import { List } from 'lucide-react';

interface ResponseHeadersProps {
  headers: Record<string, string>;
}

const ResponseHeaders: React.FC<ResponseHeadersProps> = ({ headers }) => {
  const entries = Object.entries(headers ?? {});

  return (
    <div className="h-full flex flex-col bg-pm-bg-dark">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-pm-border">
        <List size={14} className="text-pm-fg-muted" />
        <span className="text-sm text-pm-fg-secondary">
          Headers ({entries.length})
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-full text-pm-fg-muted text-sm">
            暂无响应头
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-pm-bg-mid text-pm-fg-secondary">
              <tr className="border-b border-pm-border">
                <th className="text-left font-medium px-3 py-2 w-1/3">
                  Header Name
                </th>
                <th className="text-left font-medium px-3 py-2">
                  Header Value
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr
                  key={key}
                  className="border-b border-pm-border hover:bg-pm-bg-light"
                >
                  <td className="px-3 py-2 text-pm-fg-primary font-mono text-xs">
                    {key}
                  </td>
                  <td className="px-3 py-2 text-pm-fg-secondary font-mono text-xs break-all">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ResponseHeaders;
