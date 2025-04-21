import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingsController } from './ratings.controller';
import { RatingsService } from './ratings.service';
import { Rating } from '../../typeorm/entities/Rating';
import { User } from '../../typeorm/entities/User';
import { Product } from '../../typeorm/entities/Product';
import { CartItem } from '../../typeorm/entities/CartItem';
// Import AuthModule nếu JwtAuthGuard được export từ đó
// import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rating, User, Product, CartItem]),
    // AuthModule, // Bỏ comment nếu bạn cần import AuthModule để sử dụng Guard
  ],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
