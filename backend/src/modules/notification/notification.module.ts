import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Messager } from '../../typeorm/entities/Messager';
import { Notification } from '../../typeorm/entities/Notification';
import { User } from '../../typeorm/entities/User';
import { MessagerModule } from '../messager/messager.module';
import { MessagerService } from '../messager/messager.service';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { AccountService } from '../account/account.service';
import { AccountModule } from '../account/account.module';
import { Account } from 'src/typeorm/entities/Account';
import { GatewayModule } from '../gateway/gateway.module';
import { MyGateway } from '../gateway/message.gateway';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, Messager, Account]),
    forwardRef(() => GatewayModule),
    forwardRef(() => MessagerModule),
    forwardRef(() => UserModule),
    forwardRef(() => AccountModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, MessagerService, UserService, AccountService], // Xóa MyGateway
  exports: [NotificationService],
})
export class NotificationModule {}
