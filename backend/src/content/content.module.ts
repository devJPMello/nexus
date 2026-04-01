import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { UploadedContent } from './entities/uploaded-content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UploadedContent])],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
