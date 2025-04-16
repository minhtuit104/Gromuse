import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartItemService} from './cartItem.service';
import { Payment } from '../../typeorm/entities/Payment';
import { Address } from '../../typeorm/entities/Address';
import { Voucher } from '../../typeorm/entities/Voucher';
import { Product } from '../../typeorm/entities/Product';
import { Shop } from '../../typeorm/entities/Shop';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem } from '../../typeorm/entities/CartItem';
import { CartItemController } from './cartItem.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Address,
      Voucher,
      Product,
      Shop,
      Cart,
      CartItem,
    ]),
  ],
  controllers: [CartItemController],
  providers: [CartItemService],
  exports: [CartItemService],
})
export class CartItemModule {}
