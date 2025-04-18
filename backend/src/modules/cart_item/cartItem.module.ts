import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItemService } from './cartItem.service';
import { Product } from '../../typeorm/entities/Product';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem } from '../../typeorm/entities/CartItem';
import { CartItemController } from './cartItem.controller';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItem, Product, Cart]),
    forwardRef(() => CartModule),
  ],
  controllers: [CartItemController],
  providers: [CartItemService],
  exports: [CartItemService],
})
export class CartItemModule {}
