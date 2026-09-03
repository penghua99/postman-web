import { Module } from '@nestjs/common';
import { AuthModule } from '@server/modules/auth/auth.module';
import { AdminUsersController } from './users.admin.controller';
import { AdminUsersService } from './users.admin.service';
import { AdminRolesController } from './roles.admin.controller';
import { AdminRolesService } from './roles.admin.service';
import { AdminPermissionsController } from './permissions.admin.controller';
import { AdminPermissionsService } from './permissions.admin.service';

@Module({
  imports: [AuthModule],
  controllers: [
    AdminUsersController,
    AdminRolesController,
    AdminPermissionsController,
  ],
  providers: [
    AdminUsersService,
    AdminRolesService,
    AdminPermissionsService,
  ],
})
export class AdminModule {}
