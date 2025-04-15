// src/modules/cart/cart.service.ts
import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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
  // Khởi tạo Logger
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getOrCreateUserCart(userId: number): Promise<Cart> {
    this.logger.log(
      `[getOrCreateUserCart] Finding or creating cart for userId: ${userId}`,
    );
    // Tìm giỏ hàng hiện có của user
    let cart = await this.cartRepository.findOne({
      where: { idUser: userId },
      relations: ['cartItems', 'cartItems.product', 'cartItems.product.shop'],
    });

    // Nếu user chưa có giỏ hàng, tạo mới
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
    let cart: Cart;
    if (cartId) {
      cart = await this.cartRepository.findOne({
        where: { id: cartId },
        relations: ['cartItems', 'cartItems.product', 'cartItems.product.shop'],
      });
      if (cart) {
        this.logger.log(
          `[getOrCreateCart] Found existing cart with ID: ${cartId}`,
        );
      }
    }
    if (!cart) {
      this.logger.log(
        `[getOrCreateCart] No existing cart found or no cartId provided. Creating new cart.`,
      );
      cart = this.cartRepository.create();
      try {
        await this.cartRepository.save(cart);
        this.logger.log(
          `[getOrCreateCart] New cart created with ID: ${cart.id}`,
        );
      } catch (error) {
        this.logger.error(
          `[getOrCreateCart] Error saving new cart`,
          error.stack,
        );
        throw new HttpException(
          'Could not create cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
    return cart;
  }

  async addToCart(dto: AddToCartDto): Promise<Cart> {
    this.logger.log(
      `[addToCart] Starting process for DTO: ${JSON.stringify(dto)}`,
    );
    let cart: Cart;

    // Nếu có idUser, sử dụng giỏ hàng của user đó
    if (dto.userId) {
      this.logger.log(`[addToCart] Using userId: ${dto.userId}`);
      cart = await this.getOrCreateUserCart(dto.userId);
    }
    // Nếu không, sử dụng cartId hoặc tạo giỏ hàng mới
    else {
      this.logger.log(`[addToCart] Using cartId: ${dto.cartId}`);
      cart = await this.getOrCreateCart(dto.cartId);
    }
    this.logger.log(`[addToCart] Using cart ID: ${cart.id}`);

    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
      relations: ['shop'],
    });

    if (!product) {
      this.logger.warn(
        `[addToCart] Product with ID ${dto.productId} not found.`,
      );
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }
    this.logger.log(
      `[addToCart] Found product: ${product.name} (ID: ${product.id})`,
    );

    let cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cart.id },
        product: { id: dto.productId },
        isPaid: false,
      },
      relations: ['product', 'product.shop'],
    });

    if (cartItem) {
      this.logger.log(
        `[addToCart] Found existing CartItem (ID: ${cartItem.id}). Updating quantity.`,
      );
      cartItem.quantity += dto.quantity;
      // if (dto.quantity > 0) {
      //   cartItem.isPaid = false;
      // }
    } else {
      this.logger.log(
        `[addToCart] No existing CartItem found. Creating new CartItem.`,
      );
      cartItem = this.cartItemRepository.create({
        quantity: dto.quantity,
        cart,
        product,
        isPaid: false,
        shop: product.shop,
      });
    }

    try {
      this.logger.log(
        `[addToCart] Attempting to save CartItem: ${JSON.stringify(cartItem)}`,
      );
      const savedItem = await this.cartItemRepository.save(cartItem);
      this.logger.log(
        `[addToCart] Successfully saved CartItem with ID: ${savedItem.id}`,
      );
    } catch (error) {
      this.logger.error(
        `[addToCart] Error saving CartItem for cart ID ${cart.id}`,
        error.stack,
      );
      // Ném lại lỗi để controller xử lý và trả về response lỗi phù hợp
      throw new HttpException(
        'Could not save item to cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // Trả về thông tin giỏ hàng đầy đủ sau khi cập nhật
    return this.getFullCartInfo(cart.id);
  }

  async getFullCartInfo(cartId: number): Promise<Cart> {
    this.logger.log(
      `[getFullCartInfo] Fetching full info for cart ID: ${cartId}`,
    );
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['cartItems', 'cartItems.product', 'cartItems.product.shop'],
    });

    if (!cart) {
      this.logger.warn(`[getFullCartInfo] Cart with ID ${cartId} not found.`);
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    this.logger.log(
      `[getFullCartInfo] Raw cart object found: ${JSON.stringify(cart, null, 2)}`,
    );
    // Log cụ thể cartItems
    this.logger.log(
      `[getFullCartInfo] CartItems found for cart ID ${cartId}: ${JSON.stringify(cart.cartItems, null, 2)}`,
    );

    return cart;
  }

  async getCartItems(cartId: number): Promise<CartItem[]> {
    this.logger.log(
      `[getCartItems] Fetching items for cart ID: ${cartId} using QueryBuilder`,
    );

    try {
      const cart = await this.cartRepository
        .createQueryBuilder('cart')
        .leftJoinAndSelect('cart.cartItems', 'cartItem')
        .leftJoinAndSelect('cartItem.product', 'product')
        .leftJoinAndSelect('product.shop', 'shop')
        .leftJoinAndSelect('product.category', 'category')
        .where('cart.id = :cartId', { cartId }) // Lọc theo cartId
        .andWhere('cartItem.isPaid = :isPaid', { isPaid: false })
        .orderBy('cartItem.createdAt', 'ASC') // Sắp xếp item theo thứ tự thêm vào (tùy chọn)
        .getOne(); // Lấy một Cart duy nhất

      if (!cart) {
        this.logger.warn(`[getCartItems] Cart with ID ${cartId} not found.`);
        throw new NotFoundException(`Cart with ID ${cartId} not found`);
      }

      // Log đối tượng cart đầy đủ mà QueryBuilder lấy được
      this.logger.log(
        `[getCartItems] Raw cart object found via QueryBuilder: ${JSON.stringify(cart, null, 2)}`,
      );

      // Kiểm tra xem cart.cartItems có thực sự tồn tại và là mảng không
      const itemsToReturn = Array.isArray(cart.cartItems) ? cart.cartItems : [];

      // Log dữ liệu sẽ được trả về
      this.logger.log(
        `[getCartItems] Returning CartItems for cart ID ${cartId}: ${JSON.stringify(itemsToReturn, null, 2)}`,
      );

      return itemsToReturn;
    } catch (error) {
      this.logger.error(
        `[getCartItems] Error fetching items for cart ID ${cartId}`,
        error.stack,
      );
      // Ném lại lỗi hoặc xử lý tùy theo logic của bạn
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new HttpException(
        'Could not retrieve cart items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateCartItemQuantity(
    cartId: number,
    productId: number,
    quantity: number,
  ): Promise<CartItem> {
    this.logger.log(
      `[updateCartItemQuantity] Updating quantity for cartId: ${cartId}, productId: ${productId} to quantity: ${quantity}`,
    );
    // Tìm CartItem chưa thanh toán
    const cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cartId },
        product: { id: productId },
        isPaid: false,
      },
      relations: ['product', 'product.shop'],
    });

    if (!cartItem) {
      this.logger.warn(
        `[updateCartItemQuantity] CartItem not found for cartId: ${cartId}, productId: ${productId} (or it's already paid).`,
      );
      throw new NotFoundException(`Cart item not found or already paid`);
    }

    if (quantity <= 0) {
      this.logger.log(
        `[updateCartItemQuantity] Quantity is ${quantity}. Removing CartItem ID: ${cartItem.id}`,
      );
      try {
        await this.cartItemRepository.remove(cartItem);
        this.logger.log(
          `[updateCartItemQuantity] Successfully removed CartItem ID: ${cartItem.id}`,
        );
        // Trả về null hoặc throw lỗi tùy theo logic mong muốn khi xóa item
        return null; // Hoặc throw new HttpException('Item removed', HttpStatus.OK);
      } catch (error) {
        this.logger.error(
          `[updateCartItemQuantity] Error removing CartItem ID: ${cartItem.id}`,
          error.stack,
        );
        throw new HttpException(
          'Could not remove item',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      this.logger.log(
        `[updateCartItemQuantity] Updating quantity for CartItem ID: ${cartItem.id} to ${quantity}`,
      );
      cartItem.quantity = quantity;
      try {
        const savedItem = await this.cartItemRepository.save(cartItem);
        this.logger.log(
          `[updateCartItemQuantity] Successfully updated CartItem ID: ${savedItem.id}`,
        );
        return savedItem;
      } catch (error) {
        this.logger.error(
          `[updateCartItemQuantity] Error updating CartItem ID: ${cartItem.id}`,
          error.stack,
        );
        throw new HttpException(
          'Could not update item quantity',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async clearCart(cartId: number): Promise<void> {
    this.logger.log(`[clearCart] Clearing unpaid items for cart ID: ${cartId}`);
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
    });

    if (!cart) {
      this.logger.warn(`[clearCart] Cart with ID ${cartId} not found.`);
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    // Chỉ xóa các cart items chưa thanh toán (isPaid = false)
    const deleteResult = await this.cartItemRepository.delete({
      cart: { id: cartId },
      isPaid: false,
    });
    this.logger.log(
      `[clearCart] Deleted ${deleteResult.affected} unpaid items for cart ID: ${cartId}`,
    );
  }

  async updateCartItemsStatus(
    cartId: number,
    isPaid: boolean,
    products: ProductUpdateInfo[],
  ) {
    this.logger.log(
      `[updateCartItemsStatus] Updating status for cartId: ${cartId}, isPaid: ${isPaid}, products: ${JSON.stringify(products)}`,
    );
    try {
      // Tìm các CartItem liên quan đến các product ID được cung cấp trong giỏ hàng này
      const productIds = products.map((p) => p.id);
      const cartItems = await this.cartItemRepository.find({
        where: {
          cart: { id: cartId },
          product: { id: In(productIds) }, // Sử dụng In để tìm nhiều product
        },
        relations: ['product'],
      });

      this.logger.log(
        `[updateCartItemsStatus] Found ${cartItems.length} CartItems to potentially update.`,
      );

      const updatedProductsInfo = []; // Lưu thông tin product đã được cập nhật sold count

      for (const cartItem of cartItems) {
        const matchedProductInfo = products.find(
          (p) => p.id === cartItem.productId, // Sử dụng productId để tránh lỗi nếu product relation không load
        );

        // Chỉ xử lý nếu tìm thấy thông tin product tương ứng trong DTO
        if (matchedProductInfo) {
          const wasAlreadyPaid = cartItem.isPaid; // Lưu trạng thái cũ
          this.logger.log(
            `[updateCartItemsStatus] Processing CartItem ID: ${cartItem.id} (productId: ${cartItem.productId}). Current isPaid: ${wasAlreadyPaid}. Setting isPaid to: ${isPaid}`,
          );

          cartItem.isPaid = isPaid;
          if (isPaid) {
            // Chỉ đặt là TO_RECEIVE nếu đang đánh dấu là đã thanh toán
            cartItem.status = OrderStatus.TO_RECEIVE;
          } else {
            // Nếu đánh dấu là chưa thanh toán, có thể cần reset status khác nếu cần
            // Ví dụ: cartItem.status = null; // Hoặc một trạng thái mặc định khác
          }

          try {
            await this.cartItemRepository.save(cartItem);
            this.logger.log(
              `[updateCartItemsStatus] Saved CartItem ID: ${cartItem.id} with isPaid: ${isPaid}, status: ${cartItem.status}`,
            );
          } catch (error) {
            this.logger.error(
              `[updateCartItemsStatus] Error saving CartItem ID: ${cartItem.id}`,
              error.stack,
            );
            // Cân nhắc có nên dừng lại hay tiếp tục với các item khác
            continue; // Bỏ qua item này nếu lưu lỗi
          }

          // Chỉ cập nhật số lượng 'sold' của Product nếu trạng thái chuyển từ chưa thanh toán sang đã thanh toán
          if (isPaid && !wasAlreadyPaid) {
            this.logger.log(
              `[updateCartItemsStatus] Updating sold count for Product ID: ${matchedProductInfo.id}`,
            );
            // Dùng transaction hoặc đảm bảo tính nhất quán nếu có nhiều request đồng thời
            const product = await this.productRepository.findOne({
              where: { id: matchedProductInfo.id },
            });

            if (product) {
              const currentSold =
                typeof product.sold === 'number' ? product.sold : 0;
              const quantityToAdd =
                typeof matchedProductInfo.quantity === 'number'
                  ? matchedProductInfo.quantity
                  : 0;
              product.sold = currentSold + quantityToAdd;

              try {
                await this.productRepository.save(product);
                this.logger.log(
                  `[updateCartItemsStatus] Updated sold count for Product ID: ${product.id} to ${product.sold}`,
                );
                updatedProductsInfo.push({
                  id: product.id,
                  newSoldCount: product.sold,
                });
              } catch (error) {
                this.logger.error(
                  `[updateCartItemsStatus] Error saving updated sold count for Product ID: ${product.id}`,
                  error.stack,
                );
                // Cân nhắc xử lý lỗi này
              }
            } else {
              this.logger.warn(
                `[updateCartItemsStatus] Product with ID ${matchedProductInfo.id} not found when trying to update sold count.`,
              );
            }
          }
        } else {
          this.logger.warn(
            `[updateCartItemsStatus] No matching product info found in DTO for CartItem ID: ${cartItem.id} (productId: ${cartItem.productId})`,
          );
        }
      }

      return {
        success: true,
        message: isPaid
          ? 'Cập nhật trạng thái CartItem và số lượng Product thành công'
          : 'Cập nhật trạng thái CartItem chưa thanh toán',
        updatedProductsCount: updatedProductsInfo.length, // Số lượng product được cập nhật sold
        details: updatedProductsInfo, // Chi tiết các product đã cập nhật (tùy chọn)
      };
    } catch (error) {
      this.logger.error(
        `[updateCartItemsStatus] General error for cartId: ${cartId}`,
        error.stack,
      );
      // Ném lỗi cụ thể nếu có
      if (
        error instanceof NotFoundException ||
        error instanceof HttpException
      ) {
        throw error;
      }
      // Ném lỗi chung
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
    this.logger.log(
      `[updateOrderStatus] Attempting update: cartId=${cartId}, productId=${productId}, status=${status}, reason=${cancelReason || 'N/A'}`,
    );

    // Tìm CartItem dựa trên cartId và productId
    const cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cartId },
        product: { id: productId },
        // Có thể thêm điều kiện isPaid: true nếu chỉ muốn cập nhật đơn đã thanh toán
      },
      relations: ['product'], // Load product nếu cần thông tin
    });

    if (!cartItem) {
      this.logger.warn(
        `[updateOrderStatus] CartItem not found for cartId=${cartId}, productId=${productId}`,
      );
      throw new NotFoundException('Order item not found in the specified cart');
    }

    this.logger.log(
      `[updateOrderStatus] Found CartItem ID: ${cartItem.id}. Current status: ${cartItem.status}. New status: ${status}`,
    );

    // Cập nhật trạng thái
    cartItem.status = status;

    // Thêm lý do hủy nếu có và trạng thái là hủy
    if (
      cancelReason &&
      (status === OrderStatus.CANCEL_BYUSER ||
        status === OrderStatus.CANCEL_BYSHOP)
    ) {
      cartItem.cancelReason = cancelReason;
      this.logger.log(
        `[updateOrderStatus] Setting cancel reason for CartItem ID: ${cartItem.id}`,
      );
    } else {
      // cartItem.cancelReason = null;
    }

    try {
      const savedItem = await this.cartItemRepository.save(cartItem);
      this.logger.log(
        `[updateOrderStatus] Successfully updated CartItem ID: ${savedItem.id} to status: ${savedItem.status}`,
      );
      return {
        success: true,
        message: `Order status updated successfully to: ${status}`,
        updatedItem: savedItem, // Trả về item đã cập nhật (tùy chọn)
      };
    } catch (error) {
      this.logger.error(
        `[updateOrderStatus] Error saving updated CartItem ID: ${cartItem.id}`,
        error.stack,
      );
      throw new HttpException(
        'Could not update order status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async createBuyNowCart(createCartDto: CreateCartDto): Promise<Cart> {
    this.logger.log(
      `[createBuyNowCart] Starting process for DTO: ${JSON.stringify(createCartDto)}`,
    );
    try {
      // Kiểm tra sản phẩm
      const product = await this.productRepository.findOne({
        where: { id: createCartDto.productId },
        relations: ['shop'], // Load shop relation
      });

      if (!product) {
        this.logger.warn(
          `[createBuyNowCart] Product with ID ${createCartDto.productId} not found.`,
        );
        throw new NotFoundException(
          `Product with ID ${createCartDto.productId} not found`,
        );
      }
      this.logger.log(
        `[createBuyNowCart] Found product: ${product.name} (ID: ${product.id})`,
      );

      // Tạo cart mới với idUser nếu có
      const cart = this.cartRepository.create({
        idUser: createCartDto.userId || null, // Gán userId hoặc null
      });
      try {
        await this.cartRepository.save(cart);
        this.logger.log(
          `[createBuyNowCart] Created new cart with ID: ${cart.id} for userId: ${createCartDto.userId || 'guest'}`,
        );
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

      // Tạo CartItem tạm thời với trạng thái chưa thanh toán
      const cartItem = this.cartItemRepository.create({
        cart,
        product,
        quantity: createCartDto.quantity,
        isPaid: false,
        shop: product.shop,
      });

      try {
        this.logger.log(
          `[createBuyNowCart] Attempting to save CartItem: ${JSON.stringify(cartItem)}`,
        );
        const savedItem = await this.cartItemRepository.save(cartItem);
        this.logger.log(
          `[createBuyNowCart] Successfully saved CartItem with ID: ${savedItem.id} for cart ID: ${cart.id}`,
        );
      } catch (error) {
        this.logger.error(
          `[createBuyNowCart] Error saving CartItem for cart ID ${cart.id}`,
          error.stack,
        );
        // Cân nhắc xóa cart đã tạo nếu lưu item lỗi
        // await this.cartRepository.delete(cart.id);
        throw new HttpException(
          'Could not save item for buy now cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Trả về đối tượng Cart đã tạo (chỉ chứa ID và userId)
      return cart;
    } catch (error) {
      // Ghi log lỗi chung nếu không phải là lỗi đã được xử lý (NotFound, HttpException)
      if (
        !(error instanceof NotFoundException || error instanceof HttpException)
      ) {
        this.logger.error(`[createBuyNowCart] Unexpected error`, error.stack);
      }
      // Ném lại lỗi để controller xử lý
      throw error;
    }
  }
}
