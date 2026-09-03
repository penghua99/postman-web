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
import { CollectionsService } from './collections.service';
import type {
  CollectionTreeItem,
  CreateCollectionDto,
  UpdateCollectionDto,
  ExportCollectionResponse,
  ImportCollectionDto,
} from '@shared/api.interface';

@Controller('api/collections')
@UseGuards(JwtAuthGuard)
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('tree')
  async getTree(@CurrentUserId() userId: string): Promise<CollectionTreeItem[]> {
    return this.collectionsService.getTree(userId);
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateCollectionDto,
  ): Promise<CollectionTreeItem> {
    return this.collectionsService.create(dto, userId);
  }

  @Patch(':id')
  async update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCollectionDto,
  ): Promise<CollectionTreeItem> {
    return this.collectionsService.update(id, dto, userId);
  }

  @Delete(':id')
  async remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.collectionsService.remove(id, userId);
  }

  @Get(':id/export')
  async exportCollection(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<ExportCollectionResponse> {
    return this.collectionsService.exportCollection(id, userId);
  }

  @Post('import')
  async importCollection(
    @CurrentUserId() userId: string,
    @Body() dto: ImportCollectionDto,
  ): Promise<CollectionTreeItem> {
    return this.collectionsService.importCollection(dto, userId);
  }
}
