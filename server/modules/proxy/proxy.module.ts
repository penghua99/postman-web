import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { HistoryModule } from '../history/history.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    HistoryModule,
  ],
  controllers: [ProxyController],
  providers: [ProxyService],
  exports: [ProxyService],
})
export class ProxyModule {}
