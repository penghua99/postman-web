import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import { HistoryService } from './history.service';
import type { ListHistoryResponse, HistoryItem } from '@shared/api.interface';

@Controller('api/history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @NeedLogin()
  @Get()
  async list(
    @Req() req: Request,
    @Query('limit') limit?: string,
  ): Promise<ListHistoryResponse> {
    const { userId } = (req as unknown as { userContext: { userId: string } }).userContext;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.historyService.list(userId, isNaN(limitNum) ? 50 : limitNum);
  }

  @NeedLogin()
  @Get(':id')
  async get(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<HistoryItem> {
    const { userId } = (req as unknown as { userContext: { userId: string } }).userContext;
    return this.historyService.get(id, userId);
  }

  @NeedLogin()
  @Delete('clear')
  async clear(@Req() req: Request): Promise<void> {
    const { userId } = (req as unknown as { userContext: { userId: string } }).userContext;
    await this.historyService.clear(userId);
  }

  @NeedLogin()
  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<void> {
    const { userId } = (req as unknown as { userContext: { userId: string } }).userContext;
    await this.historyService.remove(id, userId);
  }
}
