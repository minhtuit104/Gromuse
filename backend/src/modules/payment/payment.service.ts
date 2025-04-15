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
    // 1. Xử lý Address (giữ nguyên)
    let address = await this.addressRepository.findOne({
      where: {
        phone: createPaymentDto.address.phone.toString(),
        address: createPaymentDto.address.address,
        name: createPaymentDto.address.name,
      },
    });
    if (!address) {
      address = this.addressRepository.create({
        ...createPaymentDto.address,
        phone: createPaymentDto.address.phone.toString(),
      });
      await this.addressRepository.save(address);
    }

    // 2. Xử lý Vouchers (giữ nguyên)
    const vouchers = await this.processVouchers(
      createPaymentDto.voucherCodes,
      createPaymentDto.subtotal,
    );

    // *** 3. Lấy Shop Entities từ DB dựa trên IDs trong DTO ***
    let shopEntities: Shop[] = [];
    if (createPaymentDto.shops && createPaymentDto.shops.length > 0) {
      // Lấy mảng các shop ID (number)
      const shopIds = createPaymentDto.shops.map((shopDto) => shopDto.id);
      shopEntities = await this.shopRepository.findBy({
        id: In(shopIds), // Sử dụng In để tìm nhiều shop cùng lúc
      });

      // Kiểm tra xem có tìm thấy đủ shop không
      if (shopEntities.length !== shopIds.length) {
        const foundIds = shopEntities.map((s) => s.id);
        const missingIds = shopIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `Không tìm thấy các cửa hàng với ID: ${missingIds.join(', ')}`,
        );
      }
    }
    // *** Kết thúc lấy Shop Entities ***

    // 4. Tạo đối tượng Payment (không bao gồm shops ban đầu)
    const paymentDataToCreate = {
      ...createPaymentDto,
      address, // Gán Address entity
      vouchers, // Gán Voucher entities
      shops: undefined, // Bỏ shops khỏi bước tạo ban đầu
    };
    // Xóa các thuộc tính không thuộc Payment entity
    delete paymentDataToCreate.voucherCodes;
    delete paymentDataToCreate.cartId; // cartId không thuộc Payment
    delete paymentDataToCreate.shops; // Xóa shops DTO

    const payment = this.paymentRepository.create(paymentDataToCreate);

    // 5. Gán Shop entities đã lấy từ DB vào đối tượng payment
    payment.shops = shopEntities;

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

  async createFromCart(
    cartId: number,
    createPaymentDto: CreatePaymentDto,
  ): Promise<Payment> {
    try {
      const cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['cartItems', 'cartItems.product', 'cartItems.product.shop'],
      });

      if (!cart || cart.cartItems.length === 0) {
        throw new BadRequestException('Cart is empty or not found');
      }

      let address = await this.addressRepository.findOne({
        where: {
          phone: createPaymentDto.address.phone.toString(),
          address: createPaymentDto.address.address,
        },
      });

      if (!address) {
        address = this.addressRepository.create({
          ...createPaymentDto.address,
          phone: createPaymentDto.address.phone.toString(),
        });
        await this.addressRepository.save(address);
      }

      const vouchers = await this.processVouchers(
        createPaymentDto.voucherCodes,
        createPaymentDto.subtotal,
      );
      let couponDiscount = createPaymentDto.couponDiscount;

      // Tính lại total nếu có voucher
      if (vouchers.length > 0) {
        couponDiscount = this.calculateDiscount(
          vouchers,
          createPaymentDto.subtotal,
          createPaymentDto.deliveryFeeDiscounted,
        );
        createPaymentDto.total =
          createPaymentDto.subtotal +
          createPaymentDto.deliveryFeeDiscounted -
          couponDiscount;
      }

      const shops = await Promise.all(
        createPaymentDto.shops.map(async (shopDto) => {
          let shop = await this.shopRepository.findOne({
            where: { name: shopDto.name },
          });
          if (!shop) {
            shop = this.shopRepository.create({
              name: shopDto.name,
              avatar: shopDto.avatar,
              deliveryInfo: shopDto.deliveryInfo,
            });
            shop.products = shopDto.products.map((productDto) =>
              this.productRepository.create(productDto),
            );
            await this.shopRepository.save(shop);
          }
          return shop;
        }),
      );

      const payment = this.paymentRepository.create({
        ...createPaymentDto,
        couponDiscount,
        total: createPaymentDto.total,
        status: PaymentStatus.PENDING,
        address,
        vouchers,
        shops,
      });

      await this.paymentRepository.save(payment);
      await this.cartItemRepository.delete({ cart: { id: cartId } });

      return payment;
    } catch (error) {
      console.error('Lỗi trong createFromCart:', error);
      throw new InternalServerErrorException(
        'Không thể tạo đơn hàng. Vui lòng thử lại sau.',
      );
    }
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
      let address = await this.addressRepository.findOne({
        where: {
          phone: createPaymentDto.address.phone.toString(),
          address: createPaymentDto.address.address,
        },
      });

      if (!address) {
        address = this.addressRepository.create({
          ...createPaymentDto.address,
          phone: createPaymentDto.address.phone.toString(),
        });
        await queryRunner.manager.save(address);
      }
      const vouchers = await this.processVouchers(
        createPaymentDto.voucherCodes,
        createPaymentDto.subtotal,
      );

      const shops = await Promise.all(
        createPaymentDto.shops.map(async (shopDto) => {
          let shop = await this.shopRepository.findOne({
            where: { name: shopDto.name },
          });

          if (!shop) {
            shop = this.shopRepository.create({
              name: shopDto.name,
              avatar: shopDto.avatar,
              deliveryInfo: shopDto.deliveryInfo,
            });
            await queryRunner.manager.save(shop);
          }

          for (const productDto of shopDto.products) {
            await queryRunner.manager.update(
              CartItem,
              {
                productId: productDto.id,
                isPaid: false,
              },
              {
                isPaid: true,
              },
            );
          }
          return shop;
        }),
      );
      const payment = this.paymentRepository.create({
        ...createPaymentDto,
        status: PaymentStatus.PENDING,
        address,
        vouchers,
        shops,
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
