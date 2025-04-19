import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart } from '../../typeorm/entities/Cart';
import { Product } from '../../typeorm/entities/Product';
import { CartItemModule } from '../cart_item/cartItem.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Cart, Product]),
    forwardRef(() => CartItemModule),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
