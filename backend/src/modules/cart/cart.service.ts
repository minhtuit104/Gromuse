import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../typeorm/entities/Cart';
import { Product } from '../../typeorm/entities/Product';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { CreateCartDto } from './dtos/cart.dto';
import { CartItemService } from '../cart_item/cartItem.service';

interface ProductUpdateInfo {
  id: number;
  quantity: number;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private cartItemService: CartItemService,
  ) {}
  async create(createCartDto: CreateCartDto): Promise<Cart> {
    const cart = this.cartRepository.create(createCartDto);
    try {
      const savedCart = await this.cartRepository.save(cart);
      console.log('Payment saved successfully:', savedCart);

      return savedCart;
    } catch (saveError) {
      console.error('Error saving payment:', saveError);
      // Có thể log chi tiết lỗi hơn
      if (saveError.driverError) {
        console.error('Driver Error:', saveError.driverError);
      }
      throw new InternalServerErrorException('Could not save payment.');
    }
  }
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

  async addToCart(addToCartDto: AddToCartDto) {
    const cart = await this.getOrCreateUserCart(addToCartDto.userId);
    const cartItem = await this.cartItemService.addBuyNowItem(
      cart.id,
      addToCartDto.productId,
      addToCartDto.quantity,
    );
    return cartItem;
  }

  async getCartByIdUser(userId: number): Promise<Cart | null> {
    this.logger.log(`[getCartByIdUser] Finding cart for user ID: ${userId}`);
    const cart = await this.cartRepository.findOne({
      where: { idUser: userId },
      relations: ['items', 'items.product'],
    });
    if (cart) {
      this.logger.log(`[getCartByIdUser] Found cart for user ID: ${userId}`);
      return cart;
    } else {
      this.logger.log(`[getCartByIdUser] No cart found for user ID: ${userId}`);
      return null;
    }
  }
}
