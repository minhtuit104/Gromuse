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
import { Repository, In, FindManyOptions } from 'typeorm';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem, OrderStatus } from '../../typeorm/entities/CartItem';
import { Product } from '../../typeorm/entities/Product';
import { CartService } from '../cart/cart.service';
import { AddToCartDto } from '../cart/dtos/add-to-cart.dto';
import { PaidProductIdentifierDto } from '../cart/dtos/update-cart-items-status';

@Injectable()
export class CartItemService {
  private readonly logger = new Logger(CartItemService.name);

  constructor(
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @Inject(forwardRef(() => CartService))
    private cartService: CartService,
  ) {}

  async addItemToCart(dto: AddToCartDto): Promise<CartItem> {
    this.logger.log(`[addItemToCart] Adding item: ${JSON.stringify(dto)}`);
    let cart: Cart;

    // 1. Tìm hoặc tạo giỏ hàng
    if (dto.userId) {
      cart = await this.cartService.getOrCreateUserCart(dto.userId);
    } else if (dto.cartId) {
      cart = await this.cartService.getOrCreateCart(dto.cartId);
    } else {
      // Nếu không có userId và cartId, tạo cart mới (anonymous)
      cart = await this.cartService.getOrCreateCart();
      this.logger.log(
        `[addItemToCart] Created new anonymous cart ID: ${cart.id}`,
      );
    }

    // 2. Tìm sản phẩm
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });
    if (!product) {
      this.logger.warn(
        `[addItemToCart] Product with ID ${dto.productId} not found.`,
      );
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    // 3. Tìm CartItem hiện có (chưa thanh toán) trong giỏ hàng này
    let cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cart.id },
        product: { id: dto.productId },
        isPaid: false, // Chỉ tìm item chưa thanh toán
      },
      relations: ['product'], // Load relations nếu cần trả về đầy đủ
    });

    // 4. Cập nhật số lượng hoặc tạo mới
    if (cartItem) {
      this.logger.log(
        `[addItemToCart] Found existing unpaid CartItem (ID: ${cartItem.id}). Updating quantity.`,
      );
      cartItem.quantity += dto.quantity;
      // Đảm bảo isPaid vẫn là false nếu cập nhật item chưa thanh toán
      cartItem.isPaid = false;
      cartItem.status = null; // Reset status nếu cần khi thêm lại vào giỏ
    } else {
      this.logger.log(
        `[addItemToCart] No existing unpaid CartItem found. Creating new CartItem.`,
      );
      cartItem = this.cartItemRepository.create({
        quantity: dto.quantity,
        cart: cart,
        product: product,
        isPaid: false,
        status: null,
      });
    }

    // 5. Lưu CartItem
    try {
      const savedItem = await this.cartItemRepository.save(cartItem);
      this.logger.log(
        `[addItemToCart] Successfully saved CartItem with ID: ${savedItem.id} for cart ID: ${cart.id}`,
      );
      // Trả về CartItem đã lưu (có thể kèm relations nếu cần)
      // Load lại để đảm bảo có đủ relations
      return await this.cartItemRepository.findOne({
        where: { id: savedItem.id },
        relations: ['product', 'cart'], // Load các relations cần thiết
      });
    } catch (error) {
      this.logger.error(
        `[addItemToCart] Error saving CartItem for cart ID ${cart.id}`,
        error.stack,
      );
      throw new HttpException(
        'Could not save item to cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Hàm thêm item cho "Mua ngay" sau khi Cart đã được tạo
  async addBuyNowItem(
    cartId: number,
    productId: number,
    quantity: number,
  ): Promise<CartItem> {
    this.logger.log(
      `[addBuyNowItem] Adding item for buy now: cartId=${cartId}, productId=${productId}, quantity=${quantity}`,
    );

    // 1. Tìm Cart (đã được tạo bởi CartService)
    const cart = await this.cartRepository.findOne({ where: { id: cartId } });
    if (!cart) {
      this.logger.error(
        `[addBuyNowItem] Cart with ID ${cartId} not found after creation.`,
      );
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    // 2. Tìm Product
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      this.logger.warn(
        `[addBuyNowItem] Product with ID ${productId} not found.`,
      );
      // Cân nhắc xóa cart đã tạo nếu sản phẩm không tồn tại?
      // await this.cartRepository.delete(cartId);
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    // 3. Tạo CartItem mới (luôn tạo mới cho buy now)
    const cartItem = this.cartItemRepository.create({
      quantity: quantity,
      cart: cart,
      product: product,
      isPaid: false, // Mua ngay ban đầu cũng là chưa thanh toán
      status: null,
    });

    // 4. Lưu CartItem
    try {
      const savedItem = await this.cartItemRepository.save(cartItem);
      this.logger.log(
        `[addBuyNowItem] Successfully saved CartItem ID: ${savedItem.id} for buy now cart ID: ${cartId}`,
      );
      // Load lại để có relations
      return await this.cartItemRepository.findOne({
        where: { id: savedItem.id },
        relations: ['product', 'cart'],
      });
    } catch (error) {
      this.logger.error(
        `[addBuyNowItem] Error saving CartItem for buy now cart ID ${cartId}`,
        error.stack,
      );
      // Cân nhắc xóa cart đã tạo nếu lưu item lỗi
      // await this.cartRepository.delete(cartId);
      throw new HttpException(
        'Could not save item for buy now cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCartItemsByCartId(cartId: number): Promise<CartItem[]> {
    this.logger.log(
      `[getCartItemsByCartId] Fetching items for cart ID: ${cartId}`,
    );

    // Kiểm tra xem cart có tồn tại không
    const cartExists = await this.cartRepository.findOne({
      where: { id: cartId },
    });
    if (!cartExists) {
      this.logger.warn(
        `[getCartItemsByCartId] Cart with ID ${cartId} not found.`,
      );
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    try {
      const items = await this.cartItemRepository.find({
        where: {
          cart: { id: cartId },
          isPaid: false,
        },
        relations: ['product', 'product.category'],
        order: { createdAt: 'ASC' },
      });

      this.logger.log(
        `[getCartItemsByCartId] Found ${items.length} unpaid items for cart ID ${cartId}.`,
      );
      return items;
    } catch (error) {
      this.logger.error(
        `[getCartItemsByCartId] Error fetching items for cart ID ${cartId}`,
        error.stack,
      );
      throw new HttpException(
        'Could not retrieve cart items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateItemQuantity(
    cartId: number,
    productId: number,
    quantity: number,
  ): Promise<CartItem | null> {
    // Trả về null nếu item bị xóa
    this.logger.log(
      `[updateItemQuantity] Updating cartId: ${cartId}, productId: ${productId} to quantity: ${quantity}`,
    );

    // Tìm CartItem chưa thanh toán
    const cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cartId },
        product: { id: productId },
        isPaid: false, // Chỉ cập nhật item chưa thanh toán
      },
      relations: ['product', 'cart'], // Load relations nếu cần trả về
    });

    if (!cartItem) {
      this.logger.warn(
        `[updateItemQuantity] Unpaid CartItem not found for cartId: ${cartId}, productId: ${productId}.`,
      );
      throw new NotFoundException(`Unpaid cart item not found`);
    }

    if (quantity <= 0) {
      // Xóa CartItem nếu số lượng <= 0
      this.logger.log(
        `[updateItemQuantity] Quantity is ${quantity}. Removing CartItem ID: ${cartItem.id}`,
      );
      try {
        await this.cartItemRepository.remove(cartItem);
        this.logger.log(
          `[updateItemQuantity] Successfully removed CartItem ID: ${cartItem.id}`,
        );
        return null; // Trả về null để báo hiệu item đã bị xóa
      } catch (error) {
        this.logger.error(
          `[updateItemQuantity] Error removing CartItem ID: ${cartItem.id}`,
          error.stack,
        );
        throw new HttpException(
          'Could not remove item',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      // Cập nhật số lượng
      this.logger.log(
        `[updateItemQuantity] Updating quantity for CartItem ID: ${cartItem.id} to ${quantity}`,
      );
      cartItem.quantity = quantity;
      try {
        const savedItem = await this.cartItemRepository.save(cartItem);
        this.logger.log(
          `[updateItemQuantity] Successfully updated CartItem ID: ${savedItem.id}`,
        );
        return savedItem; // Trả về item đã cập nhật
      } catch (error) {
        this.logger.error(
          `[updateItemQuantity] Error updating CartItem ID: ${cartItem.id}`,
          error.stack,
        );
        throw new HttpException(
          'Could not update item quantity',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async clearUnpaidItems(cartId: number): Promise<{ affected?: number }> {
    this.logger.log(
      `[clearUnpaidItems] Clearing unpaid items for cart ID: ${cartId}`,
    );

    // Kiểm tra cart tồn tại
    const cartExists = await this.cartRepository.findOne({
      where: { id: cartId },
    });
    if (!cartExists) {
      this.logger.warn(`[clearUnpaidItems] Cart with ID ${cartId} not found.`);
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    try {
      // Chỉ xóa các cart items chưa thanh toán (isPaid = false)
      const deleteResult = await this.cartItemRepository.delete({
        cart: { id: cartId },
        isPaid: false,
      });
      this.logger.log(
        `[clearUnpaidItems] Deleted ${deleteResult.affected} unpaid items for cart ID: ${cartId}`,
      );
      return { affected: deleteResult.affected }; // Trả về số lượng bị ảnh hưởng
    } catch (error) {
      this.logger.error(
        `[clearUnpaidItems] Error deleting items for cart ID ${cartId}`,
        error.stack,
      );
      throw new HttpException(
        'Could not clear cart items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateItemsStatus(
    cartId: number,
    isPaid: boolean,
    products: PaidProductIdentifierDto[],
  ) {
    this.logger.log(
      `[updateItemsStatus] Updating status for cartId: ${cartId}, isPaid: ${isPaid}, products: ${JSON.stringify(products)}`,
    );
    try {
      const productIds = products.map((p) => p.id);
      if (productIds.length === 0) {
        this.logger.warn(
          `[updateItemsStatus] No product IDs provided for cartId: ${cartId}.`,
        );
        return {
          success: true,
          message: 'Không có sản phẩm nào được chỉ định để cập nhật.',
          updatedProductsCount: 0,
          details: [],
        };
      }

      const cartItems = await this.cartItemRepository.find({
        where: {
          cart: { id: cartId },
          product: { id: In(productIds) },
        },
      });

      this.logger.log(
        `[updateItemsStatus] Found ${cartItems.length} CartItems matching product IDs to potentially update.`,
      );

      if (cartItems.length === 0) {
        this.logger.warn(
          `[updateItemsStatus] No matching CartItems found in cart ${cartId} for the provided product IDs.`,
        );
        return {
          success: false,
          message: `Không tìm thấy sản phẩm phù hợp trong giỏ hàng ${cartId}.`,
          updatedProductsCount: 0,
          details: [],
        };
      }

      const itemsToSave: CartItem[] = [];

      for (const cartItem of cartItems) {
        const matchedProductInfo = products.find(
          (p) => p.id === cartItem.productId,
        );

        if (matchedProductInfo) {
          const wasAlreadyPaid = cartItem.isPaid;
          this.logger.log(
            `[updateItemsStatus] Processing CartItem ID: ${cartItem.id} (productId: ${cartItem.productId}). Current isPaid: ${wasAlreadyPaid}. Setting isPaid to: ${isPaid}`,
          );

          if (cartItem.isPaid !== isPaid) {
            cartItem.isPaid = isPaid;
            if (isPaid) {
              cartItem.status = OrderStatus.TO_RECEIVE;
            } else {
              cartItem.status = null;
              cartItem.cancelReason = null;
            }
            itemsToSave.push(cartItem);
          } else if (isPaid && cartItem.status !== OrderStatus.TO_RECEIVE) {
            cartItem.status = OrderStatus.TO_RECEIVE;
            itemsToSave.push(cartItem);
          }
        } else {
          this.logger.warn(
            `[updateItemsStatus] No matching product info found in DTO for CartItem ID: ${cartItem.id} (productId: ${cartItem.productId})`,
          );
        }
      }

      if (itemsToSave.length > 0) {
        await this.cartItemRepository.save(itemsToSave);
        this.logger.log(
          `[updateItemsStatus] Saved ${itemsToSave.length} CartItems.`,
        );
      }

      return {
        success: true,
        message: 'Cập nhật trạng thái CartItem thành công',
        updatedProductsCount: 0,
        details: [],
      };
    } catch (error) {
      this.logger.error(
        `[updateItemsStatus] General error for cartId: ${cartId}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Không thể cập nhật trạng thái CartItem: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateItemOrderStatus(
    cartItemId: number,
    status: OrderStatus,
    cancelReason?: string,
    // requestingUserId?: number, // Thêm nếu cần check quyền
    // requestingUserRole?: number // Thêm nếu cần check quyền
  ): Promise<{
    success: boolean;
    message: string;
    updatedItem: CartItem | null;
  }> {
    this.logger.log(
      `[updateItemOrderStatus] Attempting update for cartItemId=${cartItemId}, status=${status}, reason=${cancelReason || 'N/A'}`,
    );

    const cartItem = await this.cartItemRepository.findOne({
      where: {
        id: cartItemId,
        isPaid: true,
      },
      relations: ['product', 'cart'],
    });

    if (!cartItem) {
      this.logger.warn(
        `[updateItemOrderStatus] Paid CartItem not found for cartItemId=${cartItemId}`,
      );
      throw new NotFoundException(
        `Paid order item with ID ${cartItemId} not found`,
      );
    }

    const currentStatus = cartItem.status;
    this.logger.log(
      `[updateItemOrderStatus] Found CartItem ID: ${cartItem.id}. Current status: ${currentStatus}. New status: ${status}`,
    );

    if (
      status === OrderStatus.COMPLETE &&
      currentStatus !== OrderStatus.TO_RECEIVE
    ) {
      this.logger.warn(
        `[updateItemOrderStatus] Blocked COMPLETE: CartItem ID ${cartItem.id}, current status ${currentStatus}.`,
      );
      return {
        success: false,
        message: `Không thể hoàn thành đơn hàng đang ở trạng thái ${currentStatus}.`,
        updatedItem: cartItem,
      };
    }
    if (
      (status === OrderStatus.CANCEL_BYUSER ||
        status === OrderStatus.CANCEL_BYSHOP) &&
      currentStatus !== OrderStatus.TO_RECEIVE
    ) {
      this.logger.warn(
        `[updateItemOrderStatus] Blocked CANCEL: CartItem ID ${cartItem.id}, current status ${currentStatus}.`,
      );
      return {
        success: false,
        message: `Không thể hủy đơn hàng đang ở trạng thái ${currentStatus}.`,
        updatedItem: cartItem,
      };
    }

    // Cập nhật trạng thái và lý do
    cartItem.status = status;
    if (
      (status === OrderStatus.CANCEL_BYUSER ||
        status === OrderStatus.CANCEL_BYSHOP) &&
      cancelReason?.trim()
    ) {
      cartItem.cancelReason = cancelReason.trim();
    } else if (
      status !== OrderStatus.CANCEL_BYUSER &&
      status !== OrderStatus.CANCEL_BYSHOP
    ) {
      cartItem.cancelReason = null;
    }

    try {
      const savedItem = await this.cartItemRepository.save(cartItem);
      this.logger.log(
        `[updateItemOrderStatus] Successfully saved CartItem ID: ${savedItem.id} to status: ${savedItem.status}`,
      );
      const quantity = savedItem.quantity;
      const productId = savedItem.productId;

      if (productId && quantity > 0) {
        if (
          status === OrderStatus.COMPLETE &&
          currentStatus === OrderStatus.TO_RECEIVE
        ) {
          this.logger.log(
            `[updateItemOrderStatus] Incrementing sold count for productId: ${productId} by ${quantity}`,
          );
          try {
            // Sử dụng increment để tăng số lượng bán
            await this.productRepository.increment(
              { id: productId },
              'sold',
              quantity,
            );
            this.logger.log(
              `[updateItemOrderStatus] Successfully incremented sold count for productId: ${productId}`,
            );
          } catch (productError) {
            this.logger.error(
              `[updateItemOrderStatus] Failed to increment sold count for productId: ${productId}`,
              productError.stack,
            );
          }
        } else if (
          (status === OrderStatus.CANCEL_BYSHOP ||
            status === OrderStatus.CANCEL_BYUSER) &&
          currentStatus === OrderStatus.TO_RECEIVE
        ) {
          this.logger.log(
            `[updateItemOrderStatus] Decrementing sold count for productId: ${productId} by ${quantity}`,
          );
          try {
            const product = await this.productRepository.findOne({
              where: { id: productId },
            });
            if (product) {
              const currentSold = product.sold || 0;
              const newSold = Math.max(0, currentSold - quantity);
              if (newSold !== currentSold) {
                // Chỉ update nếu giá trị thay đổi
                await this.productRepository.update(
                  { id: productId },
                  { sold: newSold },
                );
                this.logger.log(
                  `[updateItemOrderStatus] Successfully decremented sold count for productId: ${productId} to ${newSold}`,
                );
              } else {
                this.logger.log(
                  `[updateItemOrderStatus] Sold count for productId: ${productId} is already 0 or quantity is 0. No decrement needed.`,
                );
              }
            } else {
              this.logger.warn(
                `[updateItemOrderStatus] Product not found for decrementing sold count: productId: ${productId}`,
              );
            }
          } catch (productError) {
            this.logger.error(
              `[updateItemOrderStatus] Failed to decrement sold count for productId: ${productId}`,
              productError.stack,
            );
          }
        }
      }

      return {
        success: true,
        message: `Trạng thái đơn hàng đã được cập nhật thành: ${status}`,
        updatedItem: savedItem,
      };
    } catch (error) {
      this.logger.error(
        `[updateItemOrderStatus] Error saving updated CartItem ID: ${cartItem.id}`,
        error.stack,
      );
      throw new HttpException(
        'Could not update order status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findPaidItemsByStatusTemp(
    statuses: OrderStatus[],
  ): Promise<CartItem[]> {
    this.logger.log(
      `[findPaidItemsByStatusTemp] Finding paid items with statuses: ${statuses}`,
    );
    if (!statuses || statuses.length === 0) {
      return [];
    }

    const options: FindManyOptions<CartItem> = {
      where: {
        isPaid: true,
        status: In(statuses),
      },
      relations: ['product', 'product.shop', 'cart', 'cart.user'],
      order: {
        updatedAt: 'DESC',
      },
    };

    try {
      const items = await this.cartItemRepository.find(options);
      this.logger.log(
        `[findPaidItemsByStatusTemp] Found ${items.length} items.`,
      );
      return items;
    } catch (error) {
      this.logger.error(
        `[findPaidItemsByStatusTemp] Error fetching items`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not fetch paid items by status',
      );
    }
  }
}

// ----- HÀM ĐẦY ĐỦ HƠN (Cần implement logic user/shop) -----
/*
async findPaidItemsByStatus(
    requestingUserId: number,
    requestingUserRole: number, // Giả sử có role
    statuses: OrderStatus[],
    filterShopId?: number // Optional: Lọc theo shop cụ thể nếu là admin/shop
): Promise<CartItem[]> {
    this.logger.log(`[findPaidItemsByStatus] User ${requestingUserId} (Role: ${requestingUserRole}) finding paid items with statuses: ${statuses}`);
    if (!statuses || statuses.length === 0) {
        return [];
    }

    const options: FindManyOptions<CartItem> = {
        where: {
            isPaid: true,
            status: In(statuses),
        },
        relations: ['product', 'product.shop', 'cart', 'cart.user'],
        order: { updatedAt: 'DESC' },
    };

    // --- Logic Phân Quyền ---
    if (requestingUserRole === USER_ROLE) { // Giả sử USER_ROLE là role của user thường
         // Thêm điều kiện lọc theo cart.idUser
         options.where = { ...options.where, cart: { idUser: requestingUserId } };
    } else if (requestingUserRole === SHOP_ROLE) { // Giả sử SHOP_ROLE là role của shop
        // Thêm điều kiện lọc theo product.shop.id (cần đảm bảo shop chỉ thấy đơn hàng của mình)
        // Cách 1: Join và lọc (phức tạp hơn với TypeORM where)
        // Cách 2: Lấy shopId của user đang login và lọc trực tiếp nếu có quan hệ dễ dàng
        // Ví dụ đơn giản nếu user shop có trường shopId:
        // const userShopId = await this.getShopIdForUser(requestingUserId); // Hàm lấy shopId của user
        // options.where = { ...options.where, product: { shop: { id: userShopId } } };
         if (filterShopId) { // Nếu có filter shopId rõ ràng (ví dụ từ query param)
             options.where = { ...options.where, product: { shop: { id: filterShopId } } };
         } else {
             // Cần logic để lấy shopId mặc định của user đang login
             throw new Error("Shop user must provide or have an associated shopId");
         }
    } else { // Admin có thể thấy hết hoặc cần logic khác
         if (filterShopId) {
             options.where = { ...options.where, product: { shop: { id: filterShopId } } };
         }
    }
    // --- Kết thúc Logic Phân Quyền ---


    try {
        const items = await this.cartItemRepository.find(options);
        this.logger.log(`[findPaidItemsByStatus] Found ${items.length} items for user ${requestingUserId}.`);
        return items;
    } catch (error) {
        this.logger.error(`[findPaidItemsByStatus] Error fetching items for user ${requestingUserId}`, error.stack);
        throw new InternalServerErrorException('Could not fetch paid items by status');
    }
}
*/
