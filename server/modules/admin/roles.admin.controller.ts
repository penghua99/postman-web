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
import { AdminRolesService } from './roles.admin.service';
import type { AdminRoleView, CreateRoleDto, UpdateRoleDto } from './roles.admin.service';

@Controller('api/admin/roles')
@UseGuards(AdminGuard)
export class AdminRolesController {
  constructor(private readonly adminRolesService: AdminRolesService) {}

  @Get()
  async list(): Promise<AdminRoleView[]> {
    return this.adminRolesService.list();
  }

  @Post()
  async create(@Body() dto: CreateRoleDto): Promise<AdminRoleView> {
    return this.adminRolesService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ): Promise<AdminRoleView> {
    return this.adminRolesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: true }> {
    await this.adminRolesService.remove(id);
    return { success: true };
  }
}
