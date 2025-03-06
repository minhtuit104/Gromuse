import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartItem } from '../typeorm/entities/Cart';
import { ProductsModule } from '../products/products.module';

@Module({
    imports: [TypeOrmModule.forFeature([CartItem]), forwardRef(() => ProductsModule)],
  providers: [CartService],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}