import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Messager } from 'src/typeorm/entities/Messager';
import { Notification } from 'src/typeorm/entities/Notification';
import { MessagerModule } from '../messager/messager.module';
import { UserModule } from '../users/user.module';
import { UserService } from '../users/user.service';
import { MyGateway } from './message.gateway';
import { MessagerService } from '../messager/messager.service';
@Module({
  imports: [
    forwardRef(() => MessagerModule),
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([Messager, User]),
    TypeOrmModule.forFeature([Notification, User]),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [MyGateway, MessagerService, UserService],
  exports: [MyGateway] // Thêm dòng này
})
export class GatewayModule {}
