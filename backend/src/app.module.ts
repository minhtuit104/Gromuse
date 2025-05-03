import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './typeorm/entities/User';
import { Account } from './typeorm/entities/Account';
import { Product } from './typeorm/entities/Product';
import { Category } from './typeorm/entities/Category';
import { CartItem } from './typeorm/entities/CartItem';
import { Detail } from './typeorm/entities/Detail';
import { UserModule } from './modules/users/user.module';
import { AccountModule } from './modules/account/account.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { DetailModule } from './modules/detailPage/detail.module';
import { Shop } from './typeorm/entities/Shop';
import { Cart } from './typeorm/entities/Cart';
import { Rating } from './typeorm/entities/Rating';
import { PaymentModule } from './modules/payment/payment.module';
import { Payment } from './typeorm/entities/Payment';
import { Voucher } from './typeorm/entities/Voucher';
import { CartItemModule } from './modules/cart_item/cartItem.module';
import { RatingsModule } from './modules/rating/ratings.module';
import { DashboardModule } from './modules/dashboard_shop/dashboard.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      database: 'web_gromuse',
      username: 'root',
      password: '12345',
      port: 3306,
      host: 'localhost',
      type: 'mysql',
      autoLoadEntities: true,
      logging: true,
      entities: [
        User,
        Account,
        Product,
        CartItem,
        Category,
        Detail,
        Shop,
        Cart,
        Payment,
        Voucher,
        Rating,
      ],
      synchronize: true,
    }),
    AuthModule,
    UserModule,
    AccountModule,
    ProductsModule,
    CartModule,
    DetailModule,
    PaymentModule,
    CartItemModule,
    RatingsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
