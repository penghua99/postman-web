import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import type {
  RequestItem,
  ProxyRequestDto,
  HttpMethod,
  KeyValueParam,
  RequestBody,
  AuthType,
  AuthConfig,
} from '@shared/api.interface';
import UrlBar from './UrlBar';
import TabPanel, { type TabKey } from './TabPanel';
import KeyValueEditor from './KeyValueEditor';
import BodyEditor from './BodyEditor';
import AuthEditor from './AuthEditor';

interface RequestEditorProps {
  request?: RequestItem | null;
  onSend: (data: ProxyRequestDto) => void;
  onSave?: (data: Partial<RequestItem>) => void;
  loading?: boolean;
}

const defaultParams: KeyValueParam[] = [];
const defaultHeaders: KeyValueParam[] = [
  { key: 'Content-Type', value: 'application/json', enabled: true },
];
const defaultBody: RequestBody = { mode: 'none' };
const defaultAuth: AuthConfig = {};

const RequestEditor: React.FC<RequestEditorProps> = ({
  request,
  onSend,
  onSave,
  loading = false,
}) => {
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('');
  const [params, setParams] = useState<KeyValueParam[]>(defaultParams);
  const [headers, setHeaders] = useState<KeyValueParam[]>(defaultHeaders);
  const [body, setBody] = useState<RequestBody>(defaultBody);
  const [authType, setAuthType] = useState<AuthType>('none');
  const [auth, setAuth] = useState<AuthConfig>(defaultAuth);
  const [activeTab, setActiveTab] = useState<TabKey>('params');

  useEffect(() => {
    if (request) {
      setMethod(request.method);
      setUrl(request.url);
      setParams(request.params?.length ? request.params : defaultParams);
      setHeaders(request.headers?.length ? request.headers : defaultHeaders);
      setBody(request.body ?? defaultBody);
      setAuthType(request.authType ?? 'none');
      setAuth(request.auth ?? defaultAuth);
    } else {
      setMethod('GET');
      setUrl('');
      setParams(defaultParams);
      setHeaders([
        { key: 'Content-Type', value: 'application/json', enabled: true },
      ]);
      setBody(defaultBody);
      setAuthType('none');
      setAuth(defaultAuth);
    }
  }, [request]);

  // Sync query params from URL to params list
  useEffect(() => {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `http://temp.com${url.startsWith('/') ? url : ''}`);
      const searchParams = urlObj.searchParams;
      const paramItems: KeyValueParam[] = [];
      searchParams.forEach((value, key) => {
        paramItems.push({ key, value, enabled: true });
      });
      // Only sync if URL has query params and params list is empty (initial sync)
      // Avoid overwriting user edits - compare by checking if current params match URL
      const currentEnabledParams = params.filter((p) => p.enabled);
      if (paramItems.length > 0 && currentEnabledParams.length === 0) {
        setParams(paramItems);
      }
    } catch {
      // Invalid URL, skip sync
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const handleSend = () => {
    const dto: ProxyRequestDto = {
      method,
      url,
      params,
      headers,
      body,
      authType,
      auth,
    };
    onSend(dto);
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        method,
        url,
        params,
        headers,
        body,
        authType,
        auth,
      });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'params':
        return (
          <KeyValueEditor
            items={params}
            onChange={setParams}
            keyPlaceholder="Query param"
            valuePlaceholder="Query value"
          />
        );
      case 'headers':
        return (
          <KeyValueEditor
            items={headers}
            onChange={setHeaders}
            keyPlaceholder="Header name"
            valuePlaceholder="Header value"
          />
        );
      case 'body':
        return <BodyEditor body={body} onChange={setBody} />;
      case 'auth':
        return (
          <AuthEditor
            authType={authType}
            auth={auth}
            onTypeChange={setAuthType}
            onAuthChange={setAuth}
          />
        );
      case 'pre-request':
      case 'tests':
        return (
          <div className="flex items-center justify-center h-full text-pm-fg-muted text-sm">
            This feature is not implemented yet.
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-pm-bg-mid border border-pm-border rounded">
      <div className="p-3 border-b border-pm-border">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <UrlBar
              method={method}
              url={url}
              onMethodChange={setMethod}
              onUrlChange={setUrl}
              onSend={handleSend}
              loading={loading}
            />
          </div>
          {onSave && (
            <button
              type="button"
              onClick={handleSave}
              className="h-8 px-3 flex items-center gap-1.5 bg-pm-bg-dark border border-pm-border text-pm-fg-primary text-sm rounded hover:border-pm-orange hover:bg-pm-bg-light"
            >
              <Save size={14} />
              Save
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <TabPanel activeTab={activeTab} onTabChange={setActiveTab}>
          {renderTabContent()}
        </TabPanel>
      </div>
    </div>
  );
};

export default RequestEditor;
