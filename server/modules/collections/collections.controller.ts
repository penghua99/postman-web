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
  CollectionTreeItem,
  CreateCollectionDto,
  UpdateCollectionDto,
  ExportCollectionResponse,
  ImportCollectionDto,
  RequestItem,
  CreateRequestDto,
  UpdateRequestDto,
} from '@shared/api.interface';

@Controller('api/collections')
@NeedLogin()
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('tree')
  async getTree(@Req() req: Request): Promise<CollectionTreeItem[]> {
    const { userId } = req.userContext;
    return this.collectionsService.getTree(userId);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() dto: CreateCollectionDto,
  ): Promise<CollectionTreeItem> {
    const { userId } = req.userContext;
    return this.collectionsService.create(dto, userId);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ): Promise<CollectionTreeItem> {
    const { userId } = req.userContext;
    return this.collectionsService.update(id, dto, userId);
  }

  @Delete(':id')
  async remove(@Req() req: Request, @Param('id') id: string): Promise<void> {
    const { userId } = req.userContext;
    await this.collectionsService.remove(id, userId);
  }

  @Get(':id/export')
  async exportCollection(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<ExportCollectionResponse> {
    const { userId } = req.userContext;
    return this.collectionsService.exportCollection(id, userId);
  }

  @Post('import')
  async importCollection(
    @Req() req: Request,
    @Body() dto: ImportCollectionDto,
  ): Promise<CollectionTreeItem> {
    const { userId } = req.userContext;
    return this.collectionsService.importCollection(dto, userId);
  }
}
