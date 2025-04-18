import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../typeorm/entities/Cart';
import { CreateCartDto } from './dtos/create-cart.dto';
import { Product } from '../../typeorm/entities/Product';
@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    // Không cần CartItemRepository và ProductRepository ở đây nữa (trừ khi cần cho logic Cart đặc biệt)
    @InjectRepository(Product) // Vẫn cần để kiểm tra product tồn tại trong createBuyNowCart
    private productRepository: Repository<Product>,
  ) {}

  async getOrCreateUserCart(userId: number): Promise<Cart> {
    this.logger.log(
      `[getOrCreateUserCart] Finding or creating cart for userId: ${userId}`,
    );
    let cart = await this.cartRepository.findOne({
      where: { idUser: userId },
    });

    if (!cart) {
      this.logger.log(
        `[getOrCreateUserCart] No existing cart found for userId: ${userId}. Creating new cart.`,
      );
      cart = this.cartRepository.create({ idUser: userId });
      try {
        await this.cartRepository.save(cart);
        this.logger.log(
          `[getOrCreateUserCart] New cart created with ID: ${cart.id} for userId: ${userId}`,
        );
      } catch (error) {
        this.logger.error(
          `[getOrCreateUserCart] Error saving new cart for userId: ${userId}`,
          error.stack,
        );
        throw new HttpException(
          'Could not create cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      this.logger.log(
        `[getOrCreateUserCart] Found existing cart with ID: ${cart.id} for userId: ${userId}`,
      );
    }
    return cart;
  }

  async getOrCreateCart(cartId?: number): Promise<Cart> {
    this.logger.log(
      `[getOrCreateCart] Finding or creating cart with cartId: ${cartId}`,
    );
    let cart: Cart | null = null; // Khởi tạo là null
    if (cartId) {
      cart = await this.cartRepository.findOne({
        where: { id: cartId },
        // Không cần load relations items
      });
      if (cart) {
        this.logger.log(
          `[getOrCreateCart] Found existing cart with ID: ${cartId}`,
        );
        return cart; // Trả về cart tìm thấy
      } else {
        this.logger.warn(
          `[getOrCreateCart] Cart with ID ${cartId} not found. Creating new cart.`,
        );
      }
    }

    // Nếu không có cartId hoặc không tìm thấy cart với cartId đã cho
    this.logger.log(
      `[getOrCreateCart] No existing cart found or no cartId provided. Creating new cart.`,
    );
    cart = this.cartRepository.create(); // Tạo cart mới (không có userId)
    try {
      await this.cartRepository.save(cart);
      this.logger.log(`[getOrCreateCart] New cart created with ID: ${cart.id}`);
      return cart; // Trả về cart mới tạo
    } catch (error) {
      this.logger.error(`[getOrCreateCart] Error saving new cart`, error.stack);
      throw new HttpException(
        'Could not create cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Hàm tạo cart cho "Mua ngay" - Chỉ tạo Cart, không thêm Item
  async createBuyNowCart(
    userId: number | null,
    productId: number,
  ): Promise<Cart> {
    this.logger.log(
      `[createBuyNowCart] Creating buy now cart for userId: ${userId || 'guest'}, productId: ${productId}`,
    );

    // 1. Kiểm tra sản phẩm tồn tại (vẫn cần thiết)
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      this.logger.warn(
        `[createBuyNowCart] Product with ID ${productId} not found.`,
      );
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // 2. Tạo cart mới
    const cart = this.cartRepository.create({
      idUser: userId, // Gán userId hoặc null
    });

    try {
      await this.cartRepository.save(cart);
      this.logger.log(
        `[createBuyNowCart] Created new cart with ID: ${cart.id} for userId: ${userId || 'guest'}`,
      );
      // Chỉ trả về đối tượng Cart đã tạo (chứa ID)
      return cart;
    } catch (error) {
      this.logger.error(
        `[createBuyNowCart] Error saving new cart`,
        error.stack,
      );
      throw new HttpException(
        'Could not create buy now cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
