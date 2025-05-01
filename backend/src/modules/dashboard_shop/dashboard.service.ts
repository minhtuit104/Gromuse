import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  forwardRef,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem } from '../../typeorm/entities/CartItem';
import { Product } from '../../typeorm/entities/Product';
import { CartService } from '../cart/cart.service';
import { Shop } from '../../typeorm/entities/Shop';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @Inject(forwardRef(() => CartService))
    private cartService: CartService,
  ) {}

  async findShopByUserId(userId: number): Promise<Shop> {
    // Tìm shop dựa trên userId
    // Giả định: shop.id và userId có mối liên hệ
    try {
      const shop = await this.shopRepository.findOne({
        where: { id: userId },
      });

      if (!shop) {
        throw new NotFoundException(
          `Không tìm thấy cửa hàng cho người dùng với ID ${userId}`,
        );
      }

      return shop;
    } catch (error) {
      this.logger.error(`Lỗi khi tìm shop: ${error.message}`);
      throw error;
    }
  }

  async getLatestCartItemsByShopOwner(userId: number, limit: number = 10) {
    try {
      // Tìm shop dựa trên userId
      const shop = await this.findShopByUserId(userId);

      // Tìm 10 đơn hàng mới nhất của shop
      const cartItems = await this.cartItemRepository.find({
        where: { shop: { id: shop.id } },
        relations: ['product', 'cart', 'cart.user'],
        order: { createdAt: 'DESC' },
        take: limit,
      });

      if (cartItems.length === 0) {
        return {
          message: 'Không có đơn hàng nào',
          data: [],
        };
      }

      return {
        message: 'Lấy danh sách đơn hàng thành công',
        data: cartItems,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy đơn hàng mới nhất: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi lấy danh sách đơn hàng');
    }
  }
}
