// src/modules/cart_item/cartItem.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItemService } from './cartItem.service';
import { Payment } from '../../typeorm/entities/Payment';
import { Address } from '../../typeorm/entities/Address';
import { Voucher } from '../../typeorm/entities/Voucher';
import { Product } from '../../typeorm/entities/Product';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem } from '../../typeorm/entities/CartItem';
import { CartItemController } from './cartItem.controller';

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
