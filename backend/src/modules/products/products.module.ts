import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from '../../typeorm/entities/Product';
import { Category } from '../../typeorm/entities/Category';
import { CartModule } from '../cart/cart.module';
import { Shop } from 'src/typeorm/entities/Shop';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Shop]),
    forwardRef(() => CartModule),
    AuthModule
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
