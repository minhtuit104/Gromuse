import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './typeorm/entities/User'; 
import { Account } from './typeorm/entities/Account'; 
import { Product } from './typeorm/entities/Product'; 
import { Category } from './typeorm/entities/Category';
import { CartItem } from './typeorm/entities/Cart'; 
import { UserModule } from './modules/users/user.module';
import { AccountModule } from './modules/account/account.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      database: "web_gromuse",
      username: "root",
      password: "12345",
      port: 3306,
      host: "localhost",
      type: "mysql",
      autoLoadEntities: true,
      entities: [User, Account, Product, CartItem, Category],
      synchronize: true,
    }),
    AuthModule,
    UserModule,
    AccountModule,
    ProductsModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
