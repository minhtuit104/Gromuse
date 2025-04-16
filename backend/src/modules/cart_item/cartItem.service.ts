// src/modules/payment/payment.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual, In } from 'typeorm';
import { Payment, PaymentStatus } from '../../typeorm/entities/Payment';
import { Address } from '../../typeorm/entities/Address';
import { Voucher, VoucherType } from '../../typeorm/entities/Voucher';
import { Product } from '../../typeorm/entities/Product';
import { Shop } from '../../typeorm/entities/Shop';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem } from '../../typeorm/entities/CartItem';
import { CreateCartItemDto } from './dtos/cart_item.dto';
// import { ShopDto } from './dtos/shop.dto';

@Injectable()
export class CartItemService {
  constructor(
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
  ) {}

  async create(createCartItemDto: CreateCartItemDto): Promise<CartItem> {
    const cartItem = this.cartItemRepository.create(createCartItemDto);
    try {
      const savedCartItem = await this.cartItemRepository.save(cartItem);
      console.log('Payment saved successfully:', savedCartItem);

      return savedCartItem; // Kiểu trả về là Payment
    } catch (saveError) {
      console.error('Error saving payment:', saveError);
      // Có thể log chi tiết lỗi hơn
      if (saveError.driverError) {
        console.error('Driver Error:', saveError.driverError);
      }
      throw new InternalServerErrorException('Could not save payment.');
    }
  }
}
