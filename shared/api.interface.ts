export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

export interface KeyValueParam {
  key: string;
  value: string;
  enabled: boolean;
}

export interface FormDataParam {
  key: string;
  value: string;
  type: string;
  enabled: boolean;
}

export interface RequestBody {
  mode: 'none' | 'raw' | 'json' | 'xml' | 'formdata' | 'urlencoded';
  raw?: string;
  formdata?: FormDataParam[];
  urlencoded?: KeyValueParam[];
}

export interface AuthConfig {
  bearerToken?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  apiKeyName?: string;
  apiKeyIn?: 'header' | 'query';
}

export type AuthType = 'none' | 'bearer' | 'basic' | 'apikey';

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  parentId: string | null;
  sortOrder: number;
  isFolder: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RequestItem {
  id: string;
  collectionId: string | null;
  parentId: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValueParam[];
  headers: KeyValueParam[];
  body: RequestBody;
  auth: AuthConfig;
  authType: AuthType;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentItem {
  id: string;
  name: string;
  isActive: boolean;
  variables: KeyValueParam[];
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  id: string;
  method: HttpMethod;
  url: string;
  statusCode?: number;
  responseTime?: number;
  responseSize?: number;
  requestData: {
    method: HttpMethod;
    url: string;
    params: KeyValueParam[];
    headers: KeyValueParam[];
    body: RequestBody;
    authType: AuthType;
    auth: AuthConfig;
  };
  responsePreview?: string;
  createdAt: string;
}

export interface ProxyRequestDto {
  method: HttpMethod;
  url: string;
  params: KeyValueParam[];
  headers: KeyValueParam[];
  body: RequestBody;
  authType: AuthType;
  auth: AuthConfig;
}

export interface ProxyResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: string;
  responseTime: number;
  responseSize: number;
}

export interface CollectionTreeItem extends CollectionItem {
  children: CollectionTreeItem[];
  requests: RequestItem[];
}

export interface ListCollectionsResponse {
  items: CollectionTreeItem[];
}

export interface ListRequestsResponse {
  items: RequestItem[];
}

export interface ListEnvironmentsResponse {
  items: EnvironmentItem[];
}

export interface ListHistoryResponse {
  items: HistoryItem[];
  total: number;
}

export interface CreateCollectionDto {
  name: string;
  description?: string;
  parentId?: string | null;
  isFolder?: boolean;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  parentId?: string | null;
  sortOrder?: number;
}

export interface CreateRequestDto {
  collectionId?: string | null;
  parentId?: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  params?: KeyValueParam[];
  headers?: KeyValueParam[];
  body?: RequestBody;
  auth?: AuthConfig;
  authType?: AuthType;
}

export interface UpdateRequestDto {
  name?: string;
  method?: HttpMethod;
  url?: string;
  params?: KeyValueParam[];
  headers?: KeyValueParam[];
  body?: RequestBody;
  auth?: AuthConfig;
  authType?: AuthType;
  parentId?: string | null;
  collectionId?: string | null;
  sortOrder?: number;
}

export interface CreateEnvironmentDto {
  name: string;
  variables?: KeyValueParam[];
}

export interface UpdateEnvironmentDto {
  name?: string;
  isActive?: boolean;
  variables?: KeyValueParam[];
}

export interface ExportCollectionResponse {
  collection: CollectionItem;
  requests: RequestItem[];
  folders: CollectionItem[];
}

export interface ImportCollectionDto {
  collection: {
    name: string;
    description?: string;
  };
  requests: Array<{
    name: string;
    method: HttpMethod;
    url: string;
    params?: KeyValueParam[];
    headers?: KeyValueParam[];
    body?: RequestBody;
    auth?: AuthConfig;
    authType?: AuthType;
    folderPath?: string[];
  }>;
}
