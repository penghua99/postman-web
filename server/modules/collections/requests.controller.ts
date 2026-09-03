import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  Query,
} from '@nestjs/common';
import { NeedLogin } from '@lark-apaas/fullstack-nestjs-core';
import type { Request } from 'express';
import { CollectionsService } from './collections.service';
import type {
  RequestItem,
  CreateRequestDto,
  UpdateRequestDto,
} from '@shared/api.interface';

@Controller('api/requests')
@NeedLogin()
export class RequestsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('collectionId') collectionId: string,
  ): Promise<RequestItem[]> {
    const { userId } = req.userContext;
    return this.collectionsService.listRequests(collectionId, userId);
  }

  @Get(':id')
  async get(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<RequestItem> {
    const { userId } = req.userContext;
    return this.collectionsService.getRequest(id, userId);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateRequestDto,
  ): Promise<RequestItem> {
    const { userId } = req.userContext;
    return this.collectionsService.createRequest(dto, userId);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateRequestDto,
  ): Promise<RequestItem> {
    const { userId } = req.userContext;
    return this.collectionsService.updateRequest(id, dto, userId);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { userId } = req.userContext;
    await this.collectionsService.deleteRequest(id, userId);
  }
}
