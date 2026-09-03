import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type {
  ProxyRequestDto,
  ProxyResponse,
  KeyValueParam,
  FormDataParam,
} from '@shared/api.interface';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly httpService: HttpService) {}

  async sendRequest(dto: ProxyRequestDto): Promise<ProxyResponse> {
    const startTime = Date.now();
    const url = this.buildUrl(dto.url, dto.params, dto);
    const headers = this.buildHeaders(dto.headers, dto);
    const body = this.buildBody(dto.body);

    try {
      const response = await firstValueFrom(
        this.httpService.request({
          method: dto.method,
          url,
          headers,
          data: body.data,
          responseType: 'text',
          validateStatus: () => true,
        }),
      );

      const responseTime = Date.now() - startTime;
      const data = this.formatResponseData(response.data);
      const responseSize = new TextEncoder().encode(data).length;

      const flatHeaders: Record<string, string> = {};
      const respHeaders = response.headers as Record<string, string | string[] | undefined>;
      for (const [key, value] of Object.entries(respHeaders)) {
        if (value !== undefined) {
          flatHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
        }
      }

      return {
        status: response.status,
        statusText: response.statusText || '',
        headers: flatHeaders,
        data,
        responseTime,
        responseSize,
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Proxy request failed: ${message}`);
      return {
        status: 0,
        statusText: message,
        headers: {},
        data: message,
        responseTime,
        responseSize: 0,
      };
    }
  }

  private buildUrl(
    baseUrl: string,
    params: KeyValueParam[],
    dto: ProxyRequestDto,
  ): string {
    const urlObj = new URL(baseUrl);

    for (const param of params || []) {
      if (param.enabled && param.key) {
        urlObj.searchParams.append(param.key, param.value);
      }
    }

    if (dto.authType === 'apikey' && dto.auth?.apiKeyIn === 'query' && dto.auth?.apiKeyName) {
      urlObj.searchParams.append(dto.auth!.apiKeyName, dto.auth!.apiKey || '');
    }

    return urlObj.toString();
  }

  private buildHeaders(headers: KeyValueParam[], dto: ProxyRequestDto): Record<string, string> {
    const result: Record<string, string> = {};

    for (const header of headers || []) {
      if (header.enabled && header.key) {
        result[header.key] = header.value;
      }
    }

    if (dto.authType === 'bearer' && dto.auth?.bearerToken) {
      result['Authorization'] = `Bearer ${dto.auth!.bearerToken}`;
    } else if (dto.authType === 'basic' && dto.auth?.username) {
      const token = Buffer.from(`${dto.auth!.username}:${dto.auth!.password || ''}`).toString('base64');
      result['Authorization'] = `Basic ${token}`;
    } else if (dto.authType === 'apikey' && dto.auth?.apiKeyIn !== 'query' && dto.auth?.apiKeyName) {
      result[dto.auth!.apiKeyName] = dto.auth!.apiKey || '';
    }

    const body = dto.body || ({ mode: 'none' } as ProxyRequestDto['body']);
    const hasContentType = Object.keys(result).some(
      (k) => k.toLowerCase() === 'content-type',
    );

    if (!hasContentType) {
      if (body.mode === 'json') {
        result['Content-Type'] = 'application/json';
      } else if (body.mode === 'xml') {
        result['Content-Type'] = 'application/xml';
      } else if (body.mode === 'urlencoded') {
        result['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    return result;
  }

  private buildBody(body: ProxyRequestDto['body']): { data: unknown } {
    if (!body || body.mode === 'none') {
      return { data: undefined };
    }

    if (body.mode === 'raw' || body.mode === 'json' || body.mode === 'xml') {
      return { data: body.raw || '' };
    }

    if (body.mode === 'urlencoded') {
      const params = new URLSearchParams();
      for (const item of body.urlencoded || []) {
        if (item.enabled && item.key) {
          params.append(item.key, item.value);
        }
      }
      return { data: params };
    }

    if (body.mode === 'formdata') {
      const formData = new FormData();
      for (const item of (body.formdata as FormDataParam[]) || []) {
        if (item.enabled && item.key) {
          formData.append(item.key, item.value);
        }
      }
      return { data: formData };
    }

    return { data: undefined };
  }

  private formatResponseData(data: unknown): string {
    if (typeof data === 'string') {
      return data;
    }
    if (data === null || data === undefined) {
      return '';
    }
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }
}
