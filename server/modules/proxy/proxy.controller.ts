import { Body, Controller, Post, Req, Inject } from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { ProxyService } from './proxy.service';
import { HistoryService } from '../history/history.service';
import type { ProxyRequestDto, ProxyResponse } from '@shared/api.interface';

@Controller('api/proxy')
export class ProxyController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly historyService: HistoryService,
  ) {}

  @NeedLogin()
  @Post('send')
  async send(@Req() req: Request, @Body() dto: ProxyRequestDto): Promise<ProxyResponse> {
    const { userId } = (req as unknown as { userContext: { userId: string } }).userContext;
    const response = await this.proxyService.sendRequest(dto);

    try {
      await this.historyService.create({
        method: dto.method,
        url: dto.url,
        statusCode: response.status,
        responseTime: response.responseTime,
        responseSize: response.responseSize,
        requestData: {
          method: dto.method,
          url: dto.url,
          params: dto.params,
          headers: dto.headers,
          body: dto.body,
          authType: dto.authType,
          auth: dto.auth,
        },
        responsePreview: response.data.slice(0, 500),
        userId,
      });
    } catch {
      // History recording failure should not break the proxy response
    }

    return response;
  }
}
