import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '@server/common/auth/admin.guard';
import { AdminPermissionsService } from './permissions.admin.service';
import type {
  AdminPermissionView,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './permissions.admin.service';

@Controller('api/admin/permissions')
@UseGuards(AdminGuard)
export class AdminPermissionsController {
  constructor(private readonly adminPermissionsService: AdminPermissionsService) {}

  @Get()
  async list(): Promise<AdminPermissionView[]> {
    return this.adminPermissionsService.list();
  }

  @Post()
  async create(@Body() dto: CreatePermissionDto): Promise<AdminPermissionView> {
    return this.adminPermissionsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
  ): Promise<AdminPermissionView> {
    return this.adminPermissionsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    await this.adminPermissionsService.remove(id);
    return { success: true };
  }
}
