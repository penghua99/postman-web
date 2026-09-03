import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Send } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type {
  RequestItem,
  HistoryItem,
  EnvironmentItem,
  ProxyRequestDto,
  ProxyResponse,
  KeyValueParam,
  RequestBody,
  AuthConfig,
  FormDataParam,
} from '@shared/api.interface';
import {
  proxyApi,
  environmentsApi,
  requestsApi,
} from '@client/src/api';
import { Sidebar } from '@client/src/components/postman/Sidebar';
import {
  RequestEditor,
  ResponseViewer,
} from '@client/src/components/postman';

/**
 * 环境变量替换：将 {{varName}} 占位符替换为环境变量值
 */
function replaceVariables(text: string, env: EnvironmentItem | null): string {
  if (!env || !text) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const variable = env.variables.find(
      (v: KeyValueParam) => v.key === key && v.enabled,
    );
    return variable ? variable.value : match;
  });
}

function replaceKvList(
  list: KeyValueParam[],
  env: EnvironmentItem | null,
): KeyValueParam[] {
  return list.map((item: KeyValueParam) => ({
    ...item,
    value: replaceVariables(item.value, env),
  }));
}

function replaceFormDataList(
  list: FormDataParam[] | undefined,
  env: EnvironmentItem | null,
): FormDataParam[] | undefined {
  if (!list) return list;
  return list.map((item: FormDataParam) => ({
    ...item,
    value: replaceVariables(item.value, env),
  }));
}

function replaceBody(body: RequestBody, env: EnvironmentItem | null): RequestBody {
  return {
    ...body,
    raw: body.raw !== undefined ? replaceVariables(body.raw, env) : body.raw,
    formdata: replaceFormDataList(body.formdata, env),
    urlencoded: body.urlencoded ? replaceKvList(body.urlencoded, env) : body.urlencoded,
  };
}

function replaceAuth(auth: AuthConfig, env: EnvironmentItem | null): AuthConfig {
  return {
    ...auth,
    bearerToken:
      auth.bearerToken !== undefined
        ? replaceVariables(auth.bearerToken, env)
        : auth.bearerToken,
    username:
      auth.username !== undefined
        ? replaceVariables(auth.username, env)
        : auth.username,
    password:
      auth.password !== undefined
        ? replaceVariables(auth.password, env)
        : auth.password,
    apiKey:
      auth.apiKey !== undefined ? replaceVariables(auth.apiKey, env) : auth.apiKey,
    apiKeyName:
      auth.apiKeyName !== undefined
        ? replaceVariables(auth.apiKeyName, env)
        : auth.apiKeyName,
  };
}

/**
 * 对请求数据全面应用环境变量替换
 */
function applyEnvVariables(
  req: ProxyRequestDto,
  env: EnvironmentItem | null,
): ProxyRequestDto {
  return {
    ...req,
    url: replaceVariables(req.url, env),
    params: replaceKvList(req.params, env),
    headers: replaceKvList(req.headers, env),
    body: replaceBody(req.body, env),
    auth: replaceAuth(req.auth, env),
  };
}

const PostmanPage: React.FC = () => {
  const [currentRequest, setCurrentRequest] = useState<RequestItem | null>(null);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [environments, setEnvironments] = useState<EnvironmentItem[]>([]);
  const [activeEnv, setActiveEnv] = useState<EnvironmentItem | null>(null);
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);

  // 加载环境列表
  useEffect(() => {
    let cancelled = false;
    async function loadEnvironments(): Promise<void> {
      try {
        const list: EnvironmentItem[] = await environmentsApi.list();
        if (cancelled) return;
        setEnvironments(list);
        const active = list.find((e: EnvironmentItem) => e.isActive);
        setActiveEnv(active ?? null);
      } catch (error) {
        logger.error('加载环境列表失败', error);
      }
    }
    loadEnvironments();
    return () => {
      cancelled = true;
    };
  }, []);

  // 发送请求
  const handleSend = useCallback(
    async (data: ProxyRequestDto) => {
      setLoading(true);
      setResponse(null);
      try {
        const processed = applyEnvVariables(data, activeEnv);
        const result: ProxyResponse = await proxyApi.send(processed);
        setResponse(result);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '请求失败';
        setResponse({
          status: 0,
          statusText: 'Error',
          headers: {},
          data: message,
          responseTime: 0,
          responseSize: 0,
        });
      } finally {
        setLoading(false);
      }
    },
    [activeEnv],
  );

  // 从侧边栏选择请求
  const handleSelectRequest = useCallback((request: RequestItem) => {
    setCurrentRequest({ ...request });
    setResponse(null);
  }, []);

  // 从侧边栏选择历史记录
  const handleSelectHistory = useCallback((history: HistoryItem) => {
    const req = history.requestData;
    setCurrentRequest({
      id: '',
      collectionId: null,
      parentId: null,
      name: `历史: ${history.url.slice(0, 40)}`,
      method: req.method,
      url: req.url,
      params: req.params,
      headers: req.headers,
      body: req.body,
      auth: req.auth,
      authType: req.authType,
      sortOrder: 0,
      createdAt: history.createdAt,
      updatedAt: history.createdAt,
    });
    setResponse(null);
  }, []);

  // 保存请求
  const handleSave = useCallback(
    async (data: Partial<RequestItem>) => {
      if (!currentRequest?.id) return;
      try {
        const updated: RequestItem = await requestsApi.update(
          currentRequest.id,
          data,
        );
        setCurrentRequest(updated);
      } catch (error) {
        logger.error('保存请求失败', error);
      }
    },
    [currentRequest],
  );

  // 切换环境
  const handleSwitchEnv = useCallback(
    async (env: EnvironmentItem) => {
      try {
        const updated: EnvironmentItem = await environmentsApi.setActive(env.id);
        setActiveEnv(updated);
        setEnvironments((prev: EnvironmentItem[]) =>
          prev.map((e: EnvironmentItem) =>
            e.id === env.id ? { ...e, isActive: true } : { ...e, isActive: false },
          ),
        );
      } catch (error) {
        logger.error('切换环境失败', error);
      }
      setEnvDropdownOpen(false);
    },
    [],
  );

  const hasSavedRequest = Boolean(currentRequest?.id && currentRequest?.collectionId);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-pm-bg-mid text-pm-fg-primary">
      {/* 顶栏 */}
      <header className="flex h-12 items-center justify-between border-b border-pm-border bg-pm-bg-dark px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-pm-orange">
            <Send size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-pm-fg-primary">
            API Tester
          </span>
        </div>

        {/* 环境选择器 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setEnvDropdownOpen((v) => !v)}
            className="flex h-8 items-center gap-2 rounded border border-pm-border bg-pm-bg-light px-3 text-xs text-pm-fg-secondary hover:border-pm-border-hover hover:text-pm-fg-primary"
          >
            <span className="max-w-[160px] truncate">
              {activeEnv ? activeEnv.name : 'No Environment'}
            </span>
            <ChevronDown size={14} />
          </button>
          {envDropdownOpen && (
            <div className="absolute right-0 top-9 z-50 min-w-[180px] rounded border border-pm-border bg-pm-bg-dark py-1 shadow-lg">
              {environments.length === 0 ? (
                <div className="px-3 py-2 text-xs text-pm-fg-muted">
                  暂无环境
                </div>
              ) : (
                environments.map((env: EnvironmentItem) => (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => handleSwitchEnv(env)}
                    className={`flex w-full items-center px-3 py-2 text-left text-xs transition-colors hover:bg-pm-bg-light ${
                      env.id === activeEnv?.id
                        ? 'text-pm-orange'
                        : 'text-pm-fg-secondary'
                    }`}
                  >
                    {env.name}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧边栏 */}
        <Sidebar
          onSelectRequest={handleSelectRequest}
          onSelectHistory={handleSelectHistory}
        />

        {/* 右侧编辑区 */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* 请求编辑器 */}
          <div className="flex-[1.2] overflow-hidden border-b border-pm-border">
            <RequestEditor
              request={currentRequest}
              onSend={handleSend}
              onSave={hasSavedRequest ? handleSave : undefined}
              loading={loading}
            />
          </div>

          {/* 响应区 */}
          <div className="flex-1 overflow-hidden">
            <ResponseViewer response={response} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostmanPage;
