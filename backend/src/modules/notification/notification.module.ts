import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Messager } from '../../typeorm/entities/Messager';
import { Notification } from '../../typeorm/entities/Notification';
import { User } from '../../typeorm/entities/User';
import { GatewayModule } from '../gateway/gateway.module';
import { MyGateway } from '../gateway/message.gateway';
import { MessagerModule } from '../messager/messager.module';
import { MessagerService } from '../messager/messager.service';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Messager]),
    forwardRef(() => GatewayModule),
    forwardRef(() => MessagerModule),
    forwardRef(() => UserModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, MyGateway, MessagerService, UserService],
  exports: [NotificationService],
})
export class NotificationModule {}
