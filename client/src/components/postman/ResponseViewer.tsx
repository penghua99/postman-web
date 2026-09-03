import { JSX, useState } from 'react';
import type { ProxyResponse } from '@shared/api.interface';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import ResponseStatusBar from './ResponseStatusBar';
import ResponseBody from './ResponseBody';
import ResponseHeaders from './ResponseHeaders';

type ResponseTab = 'body' | 'headers' | 'cookies' | 'test-results';

interface ResponseViewerProps {
  response: ProxyResponse | null;
  loading: boolean;
}

const TABS: { key: ResponseTab; label: string }[] = [
  { key: 'body', label: 'Body' },
  { key: 'headers', label: 'Headers' },
  { key: 'cookies', label: 'Cookies' },
  { key: 'test-results', label: 'Test Results' },
];

const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<ResponseTab>('body');

  const renderContent = (): JSX.Element => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-pm-fg-muted gap-3">
          <Loader2 size={32} className="animate-spin text-pm-orange" />
          <span className="text-sm">正在发送请求...</span>
        </div>
      );
    }

    if (!response) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-pm-fg-muted gap-3">
          <Send size={32} className="opacity-50" />
          <span className="text-sm">发送请求以查看响应</span>
        </div>
      );
    }

    if (response.status === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-pm-fg-muted gap-3">
          <AlertCircle size={32} className="text-red-400" />
          <span className="text-sm text-red-400">请求失败</span>
          <span className="text-xs max-w-md text-center">
            {response.data || '无法连接到目标服务器，请检查 URL 或网络设置。'}
          </span>
        </div>
      );
    }

    switch (activeTab) {
      case 'body':
        return <ResponseBody data={response.data} headers={response.headers} />;
      case 'headers':
        return <ResponseHeaders headers={response.headers} />;
      case 'cookies':
      case 'test-results':
        return (
          <div className="flex items-center justify-center h-full text-pm-fg-muted text-sm">
            暂无数据
          </div>
        );
      default:
        return <></>;
    }
  };

  const showTabBar = !loading && !!response && response.status !== 0;
  const showStatusBar = !loading && !!response;

  return (
    <div className="h-full flex flex-col bg-pm-bg-mid border-t border-pm-border">
      {showStatusBar && (
        <ResponseStatusBar
          status={response.status}
          statusText={response.statusText}
          responseTime={response.responseTime}
          responseSize={response.responseSize}
        />
      )}
      {showTabBar && (
        <div className="flex border-b border-pm-border bg-pm-bg-mid">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-pm-fg-primary border-pm-orange'
                  : 'text-pm-fg-secondary border-transparent hover:text-pm-fg-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-hidden">{renderContent()}</div>
    </div>
  );
};

export default ResponseViewer;
