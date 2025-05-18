import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MessagerController } from './messager.controller';
import { MessagerService } from './messager.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Messager } from 'src/typeorm/entities/Messager';
import { User } from 'src/typeorm/entities/User';

@Module({
  imports: [
    TypeOrmModule.forFeature([Messager, User]),
    EventEmitterModule.forRoot(),
  ],
  controllers: [MessagerController],
  providers: [MessagerService],
  exports: [MessagerService],
})
export class MessagerModule {}
