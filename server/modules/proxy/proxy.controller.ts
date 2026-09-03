import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@server/common/auth/jwt-auth.guard';
import { CurrentUserId } from '@server/common/auth/current-user.decorator';
import { ProxyService } from './proxy.service';
import { HistoryService } from '../history/history.service';
import type { ProxyRequestDto, ProxyResponse } from '@shared/api.interface';

@Controller('api/proxy')
@UseGuards(JwtAuthGuard)
export class ProxyController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly historyService: HistoryService,
  ) {}

  @Post('send')
  async send(
    @CurrentUserId() userId: string,
    @Body() dto: ProxyRequestDto,
  ): Promise<ProxyResponse> {
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
