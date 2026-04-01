import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GptService } from './services/gpt.service';
import { GptController } from './controllers/gpt.controller';
import { History } from './entities/history.entity';

@Module({
  imports: [TypeOrmModule.forFeature([History])],
  controllers: [GptController],
  providers: [GptService],
  exports: [GptService],
})
export class GptModule {}
