import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';

import type {
  ProxyRequestDto,
  ProxyResponse,
  CollectionTreeItem,
  RequestItem,
  EnvironmentItem,
  HistoryItem,
  CreateCollectionDto,
  UpdateCollectionDto,
  CreateRequestDto,
  UpdateRequestDto,
  CreateEnvironmentDto,
  UpdateEnvironmentDto,
  ListHistoryResponse,
  ExportCollectionResponse,
  ImportCollectionDto,
} from '@shared/api.interface';

async function request<T>(url: string, method: string, data?: unknown): Promise<T> {
  try {
    const response = await axiosForBackend({ url, method, data });
    return response.data as T;
  } catch (error) {
    logger.error(`API request failed: ${method} ${url}`, error);
    throw error;
  }
}

export const proxyApi = {
  send: (dto: ProxyRequestDto): Promise<ProxyResponse> =>
    request<ProxyResponse>('/api/proxy/send', 'POST', dto),
};

export const collectionsApi = {
  list: (): Promise<CollectionTreeItem[]> =>
    request<CollectionTreeItem[]>('/api/collections/tree', 'GET'),
  create: (dto: CreateCollectionDto): Promise<CollectionTreeItem> =>
    request<CollectionTreeItem>('/api/collections', 'POST', dto),
  update: (id: string, dto: UpdateCollectionDto): Promise<CollectionTreeItem> =>
    request<CollectionTreeItem>(`/api/collections/${id}`, 'PATCH', dto),
  remove: (id: string): Promise<void> =>
    request<void>(`/api/collections/${id}`, 'DELETE'),
  exportCollection: (id: string): Promise<ExportCollectionResponse> =>
    request<ExportCollectionResponse>(`/api/collections/${id}/export`, 'GET'),
  importCollection: (dto: ImportCollectionDto): Promise<CollectionTreeItem> =>
    request<CollectionTreeItem>('/api/collections/import', 'POST', dto),
};

export const requestsApi = {
  listByCollection: (collectionId: string): Promise<RequestItem[]> =>
    request<RequestItem[]>(`/api/requests?collectionId=${collectionId}`, 'GET'),
  get: (id: string): Promise<RequestItem> =>
    request<RequestItem>(`/api/requests/${id}`, 'GET'),
  create: (dto: CreateRequestDto): Promise<RequestItem> =>
    request<RequestItem>('/api/requests', 'POST', dto),
  update: (id: string, dto: UpdateRequestDto): Promise<RequestItem> =>
    request<RequestItem>(`/api/requests/${id}`, 'PATCH', dto),
  remove: (id: string): Promise<void> =>
    request<void>(`/api/requests/${id}`, 'DELETE'),
};

export const environmentsApi = {
  list: (): Promise<EnvironmentItem[]> =>
    request<EnvironmentItem[]>('/api/environments', 'GET'),
  create: (dto: CreateEnvironmentDto): Promise<EnvironmentItem> =>
    request<EnvironmentItem>('/api/environments', 'POST', dto),
  update: (id: string, dto: UpdateEnvironmentDto): Promise<EnvironmentItem> =>
    request<EnvironmentItem>(`/api/environments/${id}`, 'PATCH', dto),
  remove: (id: string): Promise<void> =>
    request<void>(`/api/environments/${id}`, 'DELETE'),
  setActive: (id: string): Promise<EnvironmentItem> =>
    request<EnvironmentItem>(`/api/environments/${id}/activate`, 'POST', {}),
};

export const historyApi = {
  list: (limit = 50): Promise<ListHistoryResponse> =>
    request<ListHistoryResponse>(`/api/history?limit=${limit}`, 'GET'),
  get: (id: string): Promise<HistoryItem> =>
    request<HistoryItem>(`/api/history/${id}`, 'GET'),
  remove: (id: string): Promise<void> =>
    request<void>(`/api/history/${id}`, 'DELETE'),
  clear: (): Promise<void> =>
    request<void>('/api/history/clear', 'DELETE'),
};
