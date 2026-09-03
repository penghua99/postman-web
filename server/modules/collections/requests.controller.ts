import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@server/common/auth/jwt-auth.guard';
import { CurrentUserId } from '@server/common/auth/current-user.decorator';
import { CollectionsService } from './collections.service';
import type {
  RequestItem,
  CreateRequestDto,
  UpdateRequestDto,
} from '@shared/api.interface';

@Controller('api/requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  async list(
    @CurrentUserId() userId: string,
    @Query('collectionId') collectionId: string,
  ): Promise<RequestItem[]> {
    return this.collectionsService.listRequests(collectionId, userId);
  }

  @Get(':id')
  async get(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<RequestItem> {
    return this.collectionsService.getRequest(id, userId);
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body() dto: CreateRequestDto,
  ): Promise<RequestItem> {
    return this.collectionsService.createRequest(dto, userId);
  }

  @Patch(':id')
  async update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRequestDto,
  ): Promise<RequestItem> {
    return this.collectionsService.updateRequest(id, dto, userId);
  }

  @Delete(':id')
  async remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.collectionsService.deleteRequest(id, userId);
  }
}
