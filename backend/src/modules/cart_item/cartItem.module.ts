import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem } from '../../typeorm/entities/CartItem';
import { Product } from '../../typeorm/entities/Product';
import { CartModule } from '../cart/cart.module';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../users/user.module';
import { CartItemController } from './cartItem.controller';
import { CartItemService } from './cartItem.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartItem, Product, Cart]),
    forwardRef(() => CartModule),
    UserModule,
    NotificationModule,
  ],
  controllers: [CartItemController],
  providers: [CartItemService],
  exports: [CartItemService],
})
export class CartItemModule {}
