import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from 'src/typeorm/entities/Notification';
import { CartItem } from '../../typeorm/entities/CartItem';
import { Product } from '../../typeorm/entities/Product';
import { Rating } from '../../typeorm/entities/Rating';
import { User } from '../../typeorm/entities/User';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../users/user.service';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { GatewayModule } from '../gateway/gateway.module';
import { AccountModule } from '../account/account.module';
import { Account } from 'src/typeorm/entities/Account';
// Import AuthModule nếu JwtAuthGuard được export từ đó
// import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, User, Product, CartItem, Notification, Account]),
    // AuthModule, // Bỏ comment nếu bạn cần import AuthModule để sử dụng Guard
    forwardRef(() => GatewayModule),
    forwardRef(() => AccountModule),
  ],
  controllers: [RatingsController],
  providers: [RatingsService, NotificationService, UserService],
})
export class RatingsModule {}
