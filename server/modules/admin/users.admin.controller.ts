import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '@server/common/auth/admin.guard';
import { CurrentUserId } from '@server/common/auth/current-user.decorator';
import { AdminUsersService } from './users.admin.service';
import type {
  AdminUserView,
  CreateUserDto,
  ResetPasswordDto,
  UpdateUserDto,
} from './users.admin.service';

@Controller('api/admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async list(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ): Promise<{ items: AdminUserView[]; total: number }> {
    return this.adminUsersService.list({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      keyword,
      status,
    });
  }

  @Post()
  async create(@Body() dto: CreateUserDto): Promise<AdminUserView> {
    return this.adminUsersService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<AdminUserView> {
    return this.adminUsersService.update(id, dto);
  }

  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<{ success: true }> {
    await this.adminUsersService.resetPassword(id, dto);
    return { success: true };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUserId() operatorId: string,
  ): Promise<{ success: true }> {
    await this.adminUsersService.remove(id, operatorId);
    return { success: true };
  }
}
