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
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @InjectRepository(Address) private addressRepository: Repository<Address>,
    @InjectRepository(Voucher) private voucherRepository: Repository<Voucher>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(Shop) private shopRepository: Repository<Shop>,
    @InjectRepository(Cart) private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
  ) {}

  async create(createPaymentDto: CreateCartItemDto): Promise<Payment> {
    // 2. Xử lý Vouchers (giữ nguyên)

    const payment = this.paymentRepository.create(createPaymentDto);

    // 6. Lưu đối tượng Payment hoàn chỉnh
    try {
      const savedPayment = await this.paymentRepository.save(payment);
      console.log('Payment saved successfully:', savedPayment);

      return savedPayment; // Kiểu trả về là Payment
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
