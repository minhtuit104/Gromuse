import { Module } from '@nestjs/common';
import { MessagerController } from './messager.controller';
import { MessagerService } from './messager.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Messager } from 'src/typeorm/entities/Messager';
import { User } from 'src/typeorm/entities/User';

@Module({
  imports: [TypeOrmModule.forFeature([Messager, User])],
  controllers: [MessagerController],
  providers: [MessagerService],
  exports: [MessagerService],
})
export class MessagerModule {}
