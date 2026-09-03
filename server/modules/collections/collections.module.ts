import { Module } from '@nestjs/common';
import { CollectionsController } from './collections.controller';
import { RequestsController } from './requests.controller';
import { CollectionsService } from './collections.service';

@Module({
  controllers: [CollectionsController, RequestsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
