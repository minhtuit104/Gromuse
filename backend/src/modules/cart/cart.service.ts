// src/modules/cart/cart.service.ts
import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem } from '../../typeorm/entities/CartItem';
import { Product } from '../../typeorm/entities/Product';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { CreateCartDto } from './dtos/create-cart.dto';

interface ProductUpdateInfo {
  id: number;
  quantity: number;
}

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getOrCreateCart(cartId?: number): Promise<Cart> {
    let cart: Cart;
    if (cartId) {
      cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['cartItems', 'cartItems.product', 'cartItems.product.shop'],
      });
    }
    if (!cart) {
      cart = this.cartRepository.create();
      await this.cartRepository.save(cart);
    }
    return cart;
  }

  async addToCart(dto: AddToCartDto): Promise<Cart> {
    const cart = await this.getOrCreateCart(dto.cartId);
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
      relations: ['shop'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    let cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cart.id },
        product: { id: dto.productId },
        isPaid: false,
      },
      relations: ['product', 'product.shop'],
    });

    if (cartItem) {
      cartItem.quantity += dto.quantity;
      if (dto.quantity > 0) {
        cartItem.isPaid = false;
      }
    } else {
      cartItem = this.cartItemRepository.create({
        quantity: dto.quantity,
        cart,
        product,
        isPaid: false,
      });
    }

    await this.cartItemRepository.save(cartItem);
    return this.getFullCartInfo(cart.id);
  }

  async getFullCartInfo(cartId: number): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['cartItems', 'cartItems.product', 'cartItems.product.shop'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    return cart;
  }

  async getCartItems(cartId: number): Promise<CartItem[]> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['cartItems', 'cartItems.product', 'cartItems.product.shop'],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    return cart.cartItems || [];
  }

  async updateCartItemQuantity(
    cartId: number,
    productId: number,
    quantity: number,
  ): Promise<CartItem> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { cart: { id: cartId }, product: { id: productId } },
      relations: ['product', 'product.shop'],
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item not found`);
    }

    cartItem.quantity = quantity;
    return this.cartItemRepository.save(cartItem);
  }

  async clearCart(cartId: number): Promise<void> {
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    await this.cartItemRepository.delete({ cart: { id: cartId } });
  }

  async updateCartItemsStatus(
    cartId: number,
    isPaid: boolean,
    products: ProductUpdateInfo[],
  ) {
    try {
      const cartItems = await this.cartItemRepository.find({
        where: { cart: { id: cartId } },
        relations: ['product'],
      });

      for (const cartItem of cartItems) {
        const matchedProduct = products.find(
          (p) => p.id === cartItem.product.id,
        );

        if (matchedProduct) {
          cartItem.isPaid = isPaid;
          await this.cartItemRepository.save(cartItem);
        }
      }

      // Phần cập nhật số lượng sản phẩm giữ nguyên
      const updatedProducts = [];
      for (const productInfo of products) {
        const product = await this.productRepository.findOne({
          where: { id: productInfo.id },
        });

        if (product) {
          // Chỉ cập nhật số lượng khi thanh toán thành công
          if (isPaid) {
            product.sold = (product.sold || 0) + productInfo.quantity;

            if (product.amount < productInfo.quantity) {
              throw new HttpException(
                `Sản phẩm ${product.name} không đủ số lượng. Hiện có: ${product.amount}, yêu cầu: ${productInfo.quantity}`,
                HttpStatus.BAD_REQUEST,
              );
            }

            product.amount -= productInfo.quantity;
            await this.productRepository.save(product);
            updatedProducts.push(product);
          }
        }
      }

      return {
        success: true,
        message: isPaid
          ? 'Cập nhật trạng thái CartItem và số lượng Product thành công'
          : 'Cập nhật trạng thái CartItem chưa thanh toán',
        updatedProducts: updatedProducts.length,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof HttpException
      ) {
        throw error;
      }

      throw new HttpException(
        `Không thể cập nhật trạng thái CartItem và số lượng Product: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Trong cart.service.ts
  async createBuyNowCart(createCartDto: CreateCartDto) {
    try {
      // Kiểm tra sản phẩm
      const product = await this.productRepository.findOne({
        where: { id: createCartDto.productId },
        relations: ['shop'],
      });

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${createCartDto.productId} not found`,
        );
      }

      // Kiểm tra số lượng sản phẩm
      if (product.amount < createCartDto.quantity) {
        throw new HttpException(
          `Sản phẩm ${product.name} không đủ số lượng. Hiện có: ${product.amount}, yêu cầu: ${createCartDto.quantity}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Tạo cart mới
      const cart = this.cartRepository.create();
      await this.cartRepository.save(cart);

      // Tạo CartItem tạm thời với trạng thái chưa thanh toán
      const cartItem = this.cartItemRepository.create({
        cart,
        product,
        quantity: createCartDto.quantity,
        isPaid: false,
        shop: product.shop,
      });
      await this.cartItemRepository.save(cartItem);

      return cart;
    } catch (error) {
      throw new HttpException(
        `Lỗi khi tạo giỏ hàng mua ngay: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
