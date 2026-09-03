import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@server/common/auth/jwt-auth.guard';
import { CurrentUserId } from '@server/common/auth/current-user.decorator';
import { EnvironmentsService } from './environments.service';
import type {
  EnvironmentItem,
  CreateEnvironmentDto,
  UpdateEnvironmentDto,
} from '@shared/api.interface';

@Controller('api/environments')
@UseGuards(JwtAuthGuard)
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Get()
  async list(@CurrentUserId() userId: string): Promise<EnvironmentItem[]> {
    return this.environmentsService.list(userId);
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateEnvironmentDto,
  ): Promise<EnvironmentItem> {
    return this.environmentsService.create(dto, userId);
  }

  @Patch(':id')
  async update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEnvironmentDto,
  ): Promise<EnvironmentItem> {
    return this.environmentsService.update(id, dto, userId);
  }

  @Delete(':id')
  async remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.environmentsService.remove(id, userId);
  }

  @Post(':id/activate')
  async activate(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<EnvironmentItem> {
    return this.environmentsService.setActive(id, userId);
  }
}
