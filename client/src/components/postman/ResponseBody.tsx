import { JSX, useState } from 'react';
import { Eye, Code, FileJson } from 'lucide-react';
import { formatJson, isJsonContentType } from './jsonFormatter';

type BodyView = 'pretty' | 'raw' | 'preview';

interface ResponseBodyProps {
  data: string;
  headers: Record<string, string>;
}

const ResponseBody: React.FC<ResponseBodyProps> = ({ data, headers }) => {
  const [view, setView] = useState<BodyView>('pretty');

  const contentType = headers['content-type'] ?? headers['Content-Type'] ?? '';
  const isJson = isJsonContentType(contentType);
  const isHtml = /text\/html|application\/xhtml/i.test(contentType);

  const views: { key: BodyView; label: string; icon: typeof Eye }[] = [
    { key: 'pretty', label: 'Pretty', icon: FileJson },
    { key: 'raw', label: 'Raw', icon: Code },
    { key: 'preview', label: 'Preview', icon: Eye },
  ];

  const renderBody = (): JSX.Element => {
    if (view === 'pretty') {
      if (isJson) {
        const result = formatJson(data);
        return (
          <pre className="font-mono text-sm text-pm-fg-primary whitespace-pre-wrap break-all">
            {Array.isArray(result) ? result : result}
          </pre>
        );
      }
      return (
        <pre className="font-mono text-sm text-pm-fg-primary whitespace-pre-wrap break-all">
          {data}
        </pre>
      );
    }

    if (view === 'raw') {
      return (
        <pre className="font-mono text-sm text-pm-fg-primary whitespace-pre-wrap break-all">
          {data}
        </pre>
      );
    }

    // preview
    if (isHtml) {
      return (
        <iframe
          title="response-preview"
          srcDoc={data}
          className="w-full h-full bg-white"
          sandbox="allow-scripts allow-same-origin"
        />
      );
    }
    return (
      <pre className="font-mono text-sm text-pm-fg-primary whitespace-pre-wrap break-all">
        {data}
      </pre>
    );
  };

  return (
    <div className="h-full flex flex-col bg-pm-bg-dark">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-pm-border">
        <span className="text-xs text-pm-fg-muted">
          {contentType || 'text/plain'}
        </span>
        <div className="flex items-center gap-1">
          {views.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => setView(v.key)}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                  view === v.key
                    ? 'bg-pm-bg-light text-pm-fg-primary'
                    : 'text-pm-fg-secondary hover:text-pm-fg-primary hover:bg-pm-bg-light'
                }`}
              >
                <Icon size={12} />
                {v.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">{renderBody()}</div>
    </div>
  );
};

export default ResponseBody;
