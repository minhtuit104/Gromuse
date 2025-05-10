import { forwardRef, Module } from '@nestjs/common';
import { MyGateway } from './message.gateway';
import { MessagerModule } from '../messager/messager.module';
import { MessagerService } from '../messager/messager.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Messager } from 'src/typeorm/entities/Messager';
import { Notification } from 'src/typeorm/entities/Notification';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
@Module({
  imports: [
    forwardRef(() => MessagerModule),
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([Messager, User]),
    TypeOrmModule.forFeature([Notification, User]),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [MyGateway, MessagerService, UserService],
})
export class GatewayModule {}
