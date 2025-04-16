// src/modules/payment/payment.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThanOrEqual, In } from 'typeorm';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { UpdatePaymentDto } from './dtos/update-payment.dto';
import { Payment, PaymentStatus } from '../../typeorm/entities/Payment';
import { Address } from '../../typeorm/entities/Address';
import { Voucher, VoucherType } from '../../typeorm/entities/Voucher';
import { Product } from '../../typeorm/entities/Product';
import { Shop } from '../../typeorm/entities/Shop';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem } from '../../typeorm/entities/CartItem';
// import { ShopDto } from './dtos/shop.dto';

@Injectable()
export class PaymentService {
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

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // 2. Xử lý Vouchers (giữ nguyên)

    const payment = this.paymentRepository.create(createPaymentDto);

    // 6. Lưu đối tượng Payment hoàn chỉnh
    try {
      const savedPayment = await this.paymentRepository.save(payment);
      console.log('Payment saved successfully:', savedPayment);
      const vouchers = await this.processVouchers(
        createPaymentDto.voucherCodes,
        createPaymentDto.subtotal,
      );

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

  async findAll(options: {
    page: number;
    limit: number;
    status?: PaymentStatus;
  }): Promise<{ data: Payment[]; total: number; page: number; limit: number }> {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.address', 'address')
      .leftJoinAndSelect('payment.vouchers', 'vouchers')
      .skip(skip)
      .take(limit)
      .orderBy('payment.createdAt', 'DESC');

    if (status) queryBuilder.where('payment.status = :status', { status });

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['address', 'vouchers'],
    });
    if (!payment)
      throw new NotFoundException(`Không tìm thấy đơn thanh toán với ID ${id}`);
    return payment;
  }

  async update(
    id: number,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.findOne(id);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể cập nhật đơn thanh toán ở trạng thái chờ xử lý',
      );
    }
    Object.assign(payment, updatePaymentDto);
    return this.paymentRepository.save(payment);
  }

  async remove(id: number): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }

  async applyVoucher(
    code: string,
  ): Promise<{ success: boolean; voucher?: Voucher; message: string }> {
    const voucher = await this.voucherRepository.findOne({
      where: { code, isActive: true },
    });
    if (!voucher)
      return {
        success: false,
        message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn',
      };
    if (voucher.remaining <= 0)
      return { success: false, message: 'Mã giảm giá đã hết lượt sử dụng' };

    const currentDate = new Date();
    if (voucher.endDate && voucher.endDate < currentDate)
      return { success: false, message: 'Mã giảm giá đã hết hạn' };

    return {
      success: true,
      voucher,
      message: 'Áp dụng mã giảm giá thành công',
    };
  }

  async cancelPayment(id: number): Promise<Payment> {
    const payment = await this.findOne(id);
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException(
        'Không thể hủy đơn thanh toán đã hoàn thành',
      );
    }
    payment.status = PaymentStatus.CANCELLED;
    return this.paymentRepository.save(payment);
  }

  async processPayment(id: number): Promise<Payment> {
    const payment = await this.findOne(id);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể xử lý đơn thanh toán ở trạng thái chờ xử lý',
      );
    }
    payment.status = PaymentStatus.PROCESSING;
    return this.paymentRepository.save(payment);
  }

  async completePayment(id: number): Promise<Payment> {
    const payment = await this.findOne(id);
    if (payment.status !== PaymentStatus.PROCESSING) {
      throw new BadRequestException(
        'Chỉ có thể hoàn thành đơn thanh toán ở trạng thái đang xử lý',
      );
    }
    payment.status = PaymentStatus.COMPLETED;
    return this.paymentRepository.save(payment);
  }

  async getAvailableVouchers(): Promise<Voucher[]> {
    const currentDate = new Date();
    console.log('Current Date:', currentDate);

    const vouchers = await this.voucherRepository.find({
      where: {
        isActive: true,
        remaining: MoreThan(0),
        startDate: LessThanOrEqual(currentDate),
        endDate: MoreThan(currentDate),
      },
    });

    console.log('Filtered Vouchers:', vouchers);
    return vouchers;
  }

  async confirmPayment(id: number): Promise<Payment> {
    const payment = await this.findOne(id);
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only pending payments can be confirmed');
    }
    payment.status = PaymentStatus.COMPLETED;
    return this.paymentRepository.save(payment);
  }

  // Hàm phụ trợ xử lý voucher
  private async processVouchers(
    voucherCodes: string[] | undefined,
    subtotal: number,
  ): Promise<Voucher[]> {
    const vouchers: Voucher[] = [];
    if (!voucherCodes || voucherCodes.length === 0) return vouchers;

    const currentDate = new Date();
    for (const code of voucherCodes) {
      const voucher = await this.voucherRepository.findOne({
        where: {
          code,
          isActive: true,
          remaining: MoreThan(0),
          endDate: MoreThan(currentDate),
        },
      });
      if (voucher && subtotal >= voucher.minOrderValue) {
        voucher.remaining -= 1;
        await this.voucherRepository.save(voucher);
        vouchers.push(voucher);
      }
    }
    return vouchers;
  }

  // Tính toán giảm giá từ vouchers
  private calculateDiscount(
    vouchers: Voucher[],
    subtotal: number,
    deliveryFee: number,
  ): number {
    let totalDiscount = 0;
    for (const voucher of vouchers) {
      let discount = 0;
      if (voucher.type === VoucherType.DISCOUNT) {
        discount = (subtotal * voucher.maxDiscountValue) / 100; // Giả sử maxDiscountValue là phần trăm
      } else if (voucher.type === VoucherType.FREE_SHIP) {
        discount = Math.min(voucher.maxDiscountValue, deliveryFee); // Giảm phí vận chuyển tối đa bằng maxDiscountValue
      }
      totalDiscount += Math.min(discount, voucher.maxDiscountValue); // Giới hạn bởi maxDiscountValue
    }
    return totalDiscount;
  }

  async createDirectPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<Payment> {
    // Bắt đầu transaction
    const queryRunner =
      this.paymentRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const vouchers = await this.processVouchers(
        createPaymentDto.voucherCodes,
        createPaymentDto.subtotal,
      );

      const payment = this.paymentRepository.create({
        ...createPaymentDto,
        status: PaymentStatus.PENDING,
      });

      await queryRunner.manager.save(payment);

      await queryRunner.commitTransaction();

      return payment;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Lỗi trong createDirectPayment:', error);
      throw new InternalServerErrorException(
        'Không thể tạo đơn hàng. Vui lòng thử lại sau.',
      );
    } finally {
      await queryRunner.release();
    }
  }

  async updateCartItemsWithPayment(
    cartId: number,
    paymentId: number,
  ): Promise<void> {
    // Tìm tất cả CartItem thuộc cart đã thanh toán
    const cartItems = await this.cartItemRepository.find({
      where: {
        cart: { id: cartId },
        isPaid: true,
      },
    });

    // Cập nhật paymentId cho từng CartItem
    for (const cartItem of cartItems) {
      cartItem.paymentId = paymentId;
      await this.cartItemRepository.save(cartItem);
    }
  }
}
