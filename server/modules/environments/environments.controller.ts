import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { EnvironmentsService } from './environments.service';
import type {
  EnvironmentItem,
  CreateEnvironmentDto,
  UpdateEnvironmentDto,
} from '@shared/api.interface';

@Controller('api/environments')
@NeedLogin()
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Get()
  async list(@Req() req: Request): Promise<EnvironmentItem[]> {
    const { userId } = req.userContext;
    return this.environmentsService.list(userId);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateEnvironmentDto,
  ): Promise<EnvironmentItem> {
    const { userId } = req.userContext;
    return this.environmentsService.create(dto, userId);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateEnvironmentDto,
  ): Promise<EnvironmentItem> {
    const { userId } = req.userContext;
    return this.environmentsService.update(id, dto, userId);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { userId } = req.userContext;
    await this.environmentsService.remove(id, userId);
  }

  @Post(':id/activate')
  async activate(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<EnvironmentItem> {
    const { userId } = req.userContext;
    return this.environmentsService.setActive(id, userId);
  }
}
