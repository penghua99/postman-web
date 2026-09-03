import axios from 'axios';
import { logger } from '@/utils/logger';

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
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthUser,
  AdminUserItem,
  AdminRoleItem,
  AdminPermissionItem,
} from '@shared/api.interface';

const TOKEN_KEY = 'postman_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: 30000,
});

// 请求拦截器：附加 Bearer Token
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：401 统一处理
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearToken();
      const isAuthPage =
        window.location.pathname === '/login' ||
        window.location.pathname === '/register';
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

async function request<T>(url: string, method: string, data?: unknown): Promise<T> {
  try {
    const response = await apiClient({ url, method, data });
    return response.data as T;
  } catch (error) {
    logger.error(`API request failed: ${method} ${url}`, error);
    throw error;
  }
}

// ── 认证 ────────────────────────────────────────────────────────

export const authApi = {
  login: (dto: LoginRequest): Promise<AuthResponse> =>
    request<AuthResponse>('/api/auth/login', 'POST', dto),
  register: (dto: RegisterRequest): Promise<AuthResponse> =>
    request<AuthResponse>('/api/auth/register', 'POST', dto),
  me: (): Promise<AuthUser> => request<AuthUser>('/api/auth/me', 'GET'),
};

// ── 管理端：用户 ────────────────────────────────────────────────

export const adminUsersApi = {
  list: (params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
  }): Promise<{ items: AdminUserItem[]; total: number }> => {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.status) query.set('status', params.status);
    const qs = query.toString();
    return request<{ items: AdminUserItem[]; total: number }>(
      `/api/admin/users${qs ? `?${qs}` : ''}`,
      'GET',
    );
  },
  create: (dto: {
    username: string;
    password: string;
    displayName?: string;
    email?: string;
    status?: string;
    roleIds?: string[];
  }): Promise<AdminUserItem> =>
    request<AdminUserItem>('/api/admin/users', 'POST', dto),
  update: (
    id: string,
    dto: { displayName?: string; email?: string; status?: string; roleIds?: string[] },
  ): Promise<AdminUserItem> =>
    request<AdminUserItem>(`/api/admin/users/${id}`, 'PATCH', dto),
  resetPassword: (id: string, password: string): Promise<{ success: true }> =>
    request<{ success: true }>(`/api/admin/users/${id}/reset-password`, 'POST', {
      password,
    }),
  remove: (id: string): Promise<{ success: true }> =>
    request<{ success: true }>(`/api/admin/users/${id}`, 'DELETE'),
};

// ── 管理端：角色 ────────────────────────────────────────────────

export const adminRolesApi = {
  list: (): Promise<AdminRoleItem[]> => request<AdminRoleItem[]>('/api/admin/roles', 'GET'),
  create: (dto: {
    name: string;
    code: string;
    description?: string;
    permissionIds?: string[];
  }): Promise<AdminRoleItem> =>
    request<AdminRoleItem>('/api/admin/roles', 'POST', dto),
  update: (
    id: string,
    dto: { name?: string; description?: string; permissionIds?: string[] },
  ): Promise<AdminRoleItem> =>
    request<AdminRoleItem>(`/api/admin/roles/${id}`, 'PATCH', dto),
  remove: (id: string): Promise<{ success: true }> =>
    request<{ success: true }>(`/api/admin/roles/${id}`, 'DELETE'),
};

// ── 管理端：权限 ────────────────────────────────────────────────

export const adminPermissionsApi = {
  list: (): Promise<AdminPermissionItem[]> =>
    request<AdminPermissionItem[]>('/api/admin/permissions', 'GET'),
  create: (dto: {
    name: string;
    code: string;
    description?: string;
    group?: string;
  }): Promise<AdminPermissionItem> =>
    request<AdminPermissionItem>('/api/admin/permissions', 'POST', dto),
  update: (
    id: string,
    dto: { name?: string; description?: string; group?: string },
  ): Promise<AdminPermissionItem> =>
    request<AdminPermissionItem>(`/api/admin/permissions/${id}`, 'PATCH', dto),
  remove: (id: string): Promise<{ success: true }> =>
    request<{ success: true }>(`/api/admin/permissions/${id}`, 'DELETE'),
};

// ── Postman 业务 ────────────────────────────────────────────────

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
