import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@server/common/auth/jwt-auth.guard';
import { CurrentUserId } from '@server/common/auth/current-user.decorator';
import { HistoryService } from './history.service';
import type { ListHistoryResponse, HistoryItem } from '@shared/api.interface';

@Controller('api/history')
@UseGuards(JwtAuthGuard)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  async list(
    @CurrentUserId() userId: string,
    @Query('limit') limit?: string,
  ): Promise<ListHistoryResponse> {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.historyService.list(userId, isNaN(limitNum) ? 50 : limitNum);
  }

  @Get(':id')
  async get(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<HistoryItem> {
    return this.historyService.get(id, userId);
  }

  @Delete('clear')
  async clear(@CurrentUserId() userId: string): Promise<void> {
    await this.historyService.clear(userId);
  }

  @Delete(':id')
  async remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.historyService.remove(id, userId);
  }
}
