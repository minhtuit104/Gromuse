import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem } from '../../typeorm/entities/CartItem';
import { Product } from '../../typeorm/entities/Product';
import { Shop } from '../../typeorm/entities/Shop';
import { CartModule } from '../cart/cart.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItem, Product, Cart, Shop]),
    forwardRef(() => CartModule),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
