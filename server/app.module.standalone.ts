import { APP_FILTER } from '@nestjs/core';
import { Module } from '@nestjs/common';

import { GlobalExceptionFilter } from './common/filters/exception.filter';
import { ProxyModule } from './modules/proxy/proxy.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { EnvironmentsModule } from './modules/environments/environments.module';
import { HistoryModule } from './modules/history/history.module';
import { DatabaseModule } from './modules/database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    AdminModule,
    ProxyModule,
    CollectionsModule,
    EnvironmentsModule,
    HistoryModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
