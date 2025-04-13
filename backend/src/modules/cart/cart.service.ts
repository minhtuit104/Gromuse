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
import { OrderStatus } from '../../typeorm/entities/CartItem';

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

      const updatedProducts = [];

      for (const cartItem of cartItems) {
        const matchedProduct = products.find(
          (p) => p.id === cartItem.product.id,
        );

        if (matchedProduct) {
          const wasAlreadyPaid = cartItem.isPaid;

          cartItem.isPaid = isPaid;
          if (isPaid) {
            cartItem.status = OrderStatus.TO_RECEIVE;
          }
          await this.cartItemRepository.save(cartItem);

          if (isPaid && !wasAlreadyPaid) {
            const product = await this.productRepository.findOne({
              where: { id: matchedProduct.id },
            });

            if (product) {
              // Lấy giá trị sold hiện tại, đảm bảo là number
              const currentSold =
                typeof product.sold === 'number' ? product.sold : 0;

              // Cập nhật giá trị sold
              product.sold = currentSold + matchedProduct.quantity;

              await this.productRepository.save(product);
              updatedProducts.push(product);
            }
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

  //phương thức để cập nhật trạng thái đơn hàng
  async updateOrderStatus(
    cartId: number,
    productId: number,
    status: OrderStatus,
    cancelReason?: string,
  ) {
    console.log(
      `Attempting to update order: cartId=${cartId}, productId=${productId}, status=${status}`,
    );

    // Find the CartItem with more logging
    const cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cartId },
        product: { id: productId },
      },
      relations: ['product'],
    });

    console.log('Found CartItem:', cartItem ? 'Yes' : 'No');

    if (!cartItem) {
      console.log(
        `No CartItem found for cartId=${cartId}, productId=${productId}`,
      );
      throw new NotFoundException('Order not found');
    }

    // Update status
    cartItem.status = status;

    // Add cancel reason if applicable
    if (
      cancelReason &&
      (status === OrderStatus.CANCEL_BYUSER ||
        status === OrderStatus.CANCEL_BYSHOP)
    ) {
      cartItem.cancelReason = cancelReason;
    }

    // Save to database
    const savedItem = await this.cartItemRepository.save(cartItem);
    console.log(`CartItem updated with status: ${savedItem.status}`);

    return {
      success: true,
      message: `Order status updated successfully: ${status}`,
    };
  }

  async createBuyNowCart(createCartDto: CreateCartDto) {
    try {
      console.log('Xử lý Buy Now trong service:', createCartDto);
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
