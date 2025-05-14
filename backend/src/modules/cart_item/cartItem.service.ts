import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Cart } from '../../typeorm/entities/Cart';
import { CartItem, OrderStatus } from '../../typeorm/entities/CartItem';
import { NotificationContentType } from '../../typeorm/entities/Notification';
import { Product } from '../../typeorm/entities/Product';
import { CartService } from '../cart/cart.service';
import { AddToCartDto } from '../cart/dtos/add-to-cart.dto';
import { NotificationService } from '../notification/notification.service';

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
    private readonly notificationService: NotificationService,
  ) {}

  async getCartById(idUser: number): Promise<Cart | null> {
    return this.cartRepository.findOne({
      where: { idUser: idUser },
      relations: ['user'],
    });
  }

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
      relations: ['shop'],
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
        shop: product.shop,
      });
    }

    // 5. Lưu CartItem
    try {
      const savedItem = await this.cartItemRepository.save(cartItem);
      this.logger.log(
        `[addItemToCart] Successfully saved CartItem with ID: ${savedItem.id} for cart ID: ${cart.id}`,
      );
      return await this.cartItemRepository.findOne({
        where: { id: savedItem.id },
        relations: ['product', 'cart'],
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
      relations: ['shop'],
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
      shop: product.shop,
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
    cartItemId: number,
    quantity: number,
  ): Promise<CartItem | null> {
    this.logger.log(
      `[updateItemQuantity] Updating cartItemId: ${cartItemId} to quantity: ${quantity}`,
    );

    // Tìm CartItem bằng ID và chưa thanh toán
    const cartItem = await this.cartItemRepository.findOne({
      where: {
        id: cartItemId,
        isPaid: false,
      },
      relations: ['product', 'cart'],
    });

    if (!cartItem) {
      this.logger.warn(
        `[updateItemQuantity] Unpaid CartItem not found for cartItemId: ${cartItemId}.`,
      );
      throw new NotFoundException(`Unpaid cart item not found`);
    }

    // Logic xóa hoặc cập nhật giữ nguyên
    if (quantity <= 0) {
      this.logger.log(
        `[updateItemQuantity] Quantity is ${quantity}. Removing CartItem ID: ${cartItem.id}`,
      );
      try {
        await this.cartItemRepository.remove(cartItem);
        this.logger.log(
          `[updateItemQuantity] Successfully removed CartItem ID: ${cartItem.id}`,
        );
        return null;
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
      this.logger.log(
        `[updateItemQuantity] Updating quantity for CartItem ID: ${cartItem.id} to ${quantity}`,
      );
      cartItem.quantity = quantity;
      try {
        const savedItem = await this.cartItemRepository.save(cartItem);
        this.logger.log(
          `[updateItemQuantity] Successfully updated CartItem ID: ${savedItem.id}`,
        );
        return savedItem;
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

  async clearUserCart(userId: number): Promise<{ affected?: number }> {
    this.logger.log(
      `[clearUserCart] Clearing unpaid items for user ID: ${userId}`,
    );

    // 1. Tìm giỏ hàng của người dùng
    const cart = await this.cartRepository.findOne({
      where: { idUser: userId },
    });

    if (!cart) {
      this.logger.warn(
        `[clearUserCart] Cart not found for user ID: ${userId}. Nothing to clear.`,
      );
      // Không cần throw lỗi, chỉ cần trả về 0 affected
      return { affected: 0 };
    }

    // 2. Gọi hàm clearUnpaidItems với cartId tìm được
    this.logger.log(
      `[clearUserCart] Found cart ID: ${cart.id} for user ID: ${userId}. Proceeding to clear.`,
    );
    try {
      // Hàm clearUnpaidItems đã có logic xóa isPaid=false
      return await this.clearUnpaidItems(cart.id);
    } catch (error) {
      // clearUnpaidItems đã có logging và throw HttpException
      // Chỉ cần log thêm context nếu cần
      this.logger.error(
        `[clearUserCart] Error occurred while calling clearUnpaidItems for cart ID ${cart.id}`,
        error.stack,
      );
      // Re-throw lỗi từ clearUnpaidItems
      throw error;
    }
  }

  async updateItemsStatus(
    cartId: number,
    isPaid: boolean,
    cartItemIds: number[], // <<< Nhận mảng cartItemIds
  ): Promise<{ success: boolean; message: string; updatedCount: number }> {
    // <<< Sửa kiểu trả về nếu cần
    this.logger.log(
      `[updateItemsStatus] Updating status for cartId: ${cartId}, isPaid: ${isPaid}, cartItemIds: ${JSON.stringify(cartItemIds)}`,
    );
    try {
      if (!cartItemIds || cartItemIds.length === 0) {
        this.logger.warn(
          `[updateItemsStatus] No cartItem IDs provided for cartId: ${cartId}.`,
        );
        return {
          success: true,
          message: 'Không có mục nào được chỉ định để cập nhật.',
          updatedCount: 0,
        };
      }

      // Tìm các CartItem dựa trên cartId và mảng cartItemIds
      const cartItems = await this.cartItemRepository.find({
        where: {
          cart: { id: cartId },
          id: In(cartItemIds),
          // isPaid: false
        },
      });

      console.log('cartItems payment', cartItems);

      if (cartItems.length === 0) {
        this.logger.warn(
          `[updateItemsStatus] No matching CartItems found in cart ${cartId} for the provided cartItem IDs.`,
        );
        // Không nên báo lỗi ở đây vì có thể frontend gửi ID không khớp
        return {
          success: true, // Vẫn coi là thành công vì không có gì để update
          message: `Không tìm thấy mục phù hợp trong giỏ hàng ${cartId} để cập nhật.`,
          updatedCount: 0,
        };
      }

      const itemsToSave: CartItem[] = [];

      for (const cartItem of cartItems) {
        const wasAlreadyPaid = cartItem.isPaid;
        this.logger.log(
          `[updateItemsStatus] Processing CartItem ID: ${cartItem.id}. Current isPaid: ${wasAlreadyPaid}. Setting isPaid to: ${isPaid}`,
        );

        // Chỉ cập nhật nếu trạng thái isPaid thay đổi hoặc nếu đang set isPaid=true
        if (!cartItem.isPaid) {
          cartItem.isPaid = isPaid;
          cartItem.status = OrderStatus.TO_ORDER;
          itemsToSave.push(cartItem);
        }
      }

      let savedCount = 0;
      if (itemsToSave.length > 0) {
        const savedItems = await this.cartItemRepository.save(itemsToSave);
        savedCount = savedItems.length;
        this.logger.log(
          `[updateItemsStatus] Saved ${savedCount} CartItems with new status.`,
        );
      } else {
        this.logger.log(
          `[updateItemsStatus] No CartItems needed status update for cartId: ${cartId}.`,
        );
      }

      return {
        success: true,
        message: `Cập nhật trạng thái thành công cho ${savedCount} mục.`,
        updatedCount: savedCount,
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
      relations: ['product', 'cart', 'cart.user', 'shop'],
    });

    // console.log('cartItem update status', cartItem);

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
      currentStatus !== OrderStatus.TO_RECEIVE && // Cho phép hủy từ TO_ORDER
      currentStatus !== OrderStatus.TO_ORDER
    ) {
      this.logger.warn(
        `[updateItemOrderStatus] Blocked CANCEL: CartItem ID ${cartItem.id}, current status ${currentStatus}.`,
      );
      return {
        success: false,
        message: `Không thể hủy đơn hàng đang ở trạng thái ${currentStatus}. Chỉ có thể hủy khi đang chờ xử lý hoặc đang giao.`,
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

      // Gửi thông báo dựa trên trạng thái mới
      let notificationType: NotificationContentType;
      let notificationMessage: string;

      let notificationMessageForShop: string;
      switch (status) {
        case OrderStatus.TO_ORDER:
          notificationType = NotificationContentType.NEW_ORDER_FOR_SHOP;
          notificationMessage = `Đơn hàng #${savedItem.id} đã được đặt thành công`;
          notificationMessageForShop = `Bạn có đơn hàng mới #${savedItem.id} từ khách hàng ${savedItem.cart.user?.name || 'Không xác định'}`;
          break;
        case OrderStatus.TO_RECEIVE:
          notificationType = NotificationContentType.ORDER_SHIPPED;
          notificationMessage = `Đơn hàng #${savedItem.id} đang được giao`;
          notificationMessageForShop = `Đơn hàng #${savedItem.id} đã được gửi đi và đang trong quá trình vận chuyển`;
          break;
        case OrderStatus.COMPLETE:
          notificationType = NotificationContentType.ORDER_COMPLETED;
          notificationMessage = `Đơn hàng #${savedItem.id} đã hoàn thành`;
          notificationMessageForShop = `Đơn hàng #${savedItem.id} đã được giao thành công cho khách hàng`;
          break;
        case OrderStatus.CANCEL_BYUSER:
          notificationType = NotificationContentType.ORDER_CANCELLED_BY_USER;
          notificationMessage = `Đơn hàng #${savedItem.id} đã bị hủy bởi người mua`;
          notificationMessageForShop = `Khách hàng ${savedItem.cart.user?.name || 'Không xác định'} đã hủy đơn hàng #${savedItem.id}`;
          break;
        case OrderStatus.CANCEL_BYSHOP:
          notificationType = NotificationContentType.ORDER_CANCELLED_BY_SHOP;
          notificationMessage = `Đơn hàng #${savedItem.id} đã bị hủy bởi người bán`;
          notificationMessageForShop = `Bạn đã hủy đơn hàng #${savedItem.id}`;
          break;
        default:
          break;
      }

      if (notificationType && notificationMessage) {
        try {
          await this.notificationService.createOrderNotification(
            savedItem,
            notificationType,
            notificationMessage,
            notificationMessageForShop,
          );
        } catch (notificationError) {
          this.logger.error(
            `[updateItemOrderStatus] Error creating notification for CartItem ID: ${savedItem.id}`,
            notificationError.stack,
          );
        }
      }

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
          // *** CHỈ GIẢM SOLD KHI HỦY TỪ TO_RECEIVE ***
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

  async findPaidItemsByStatus(
    statuses: OrderStatus[],
    requestingUserId: number,
  ): Promise<CartItem[]> {
    this.logger.log(
      `[findPaidItemsByStatus] User ${requestingUserId} finding paid items with statuses: ${statuses}`,
    );
    if (!statuses || statuses.length === 0) {
      return [];
    }

    try {
      // Sử dụng QueryBuilder thay vì find với options
      console.log('requestingUserId', requestingUserId);
      const items = await this.cartItemRepository
        .createQueryBuilder('cartItem')
        .leftJoinAndSelect('cartItem.product', 'product')
        .leftJoinAndSelect('product.shop', 'shop')
        .leftJoinAndSelect('cartItem.cart', 'cart')
        .leftJoinAndSelect('cart.user', 'user')
        .leftJoinAndSelect('cartItem.rating', 'rating')
        .where('cartItem.isPaid = :isPaid', { isPaid: true })
        .andWhere('cart.idUser = :userId', { userId: requestingUserId })
        .andWhere('cartItem.status IN (:...statuses)', { statuses })
        .orderBy('cartItem.updatedAt', 'DESC')
        .getMany();

      this.logger.log(`[findPaidItemsByStatus] Found ${items.length} items.`);
      return items;
    } catch (error) {
      this.logger.error(
        `[findPaidItemsByStatus] Error fetching items for user ${requestingUserId}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not fetch paid items by status',
      );
    }
  }

  async getUnpaidCartItemsCount(userId: number): Promise<number> {
    this.logger.log(
      `[getUnpaidCartItemsCount] Counting unpaid items for user: ${userId}`,
    );

    try {
      // Tìm giỏ hàng của người dùng
      const cart = await this.cartRepository.findOne({
        where: { idUser: userId },
      });

      if (!cart) {
        this.logger.log(
          `[getUnpaidCartItemsCount] No cart found for user ID: ${userId}`,
        );
        return 0; // Trả về 0 nếu không có giỏ hàng
      }

      // Đếm số lượng cart item chưa thanh toán (COUNT thay vì SUM)
      const result = await this.cartItemRepository
        .createQueryBuilder('cartItem')
        .select('COUNT(cartItem.id)', 'itemCount')
        .where('cartItem.cartId = :cartId', { cartId: cart.id })
        .andWhere('cartItem.isPaid = :isPaid', { isPaid: false })
        .getRawOne();

      const count = result?.itemCount || 0;
      this.logger.log(
        `[getUnpaidCartItemsCount] Found ${count} unpaid cart items for user: ${userId}`,
      );

      return Number(count);
    } catch (error) {
      this.logger.error(
        `[getUnpaidCartItemsCount] Error counting unpaid items for user: ${userId}`,
        error.stack,
      );
      throw new HttpException(
        'Could not count unpaid cart items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findShopOrdersByStatus(
    statuses: OrderStatus[],
    requestingShopId: number, // <<< Nhận shopId
  ): Promise<CartItem[]> {
    this.logger.log(
      `[findShopOrdersByStatus] Shop ${requestingShopId} finding paid items with statuses: ${statuses}`,
    );
    if (!statuses || statuses.length === 0) {
      return [];
    }

    const items = await this.cartItemRepository
      .createQueryBuilder('cartItem')
      .leftJoinAndSelect('cartItem.product', 'product')
      .leftJoinAndSelect('cartItem.shop', 'shop')
      .leftJoinAndSelect('cartItem.cart', 'cart')
      .leftJoinAndSelect('cart.user', 'user')
      .where('cartItem.isPaid = :isPaid', { isPaid: true })
      .andWhere('shop.id = :shopId', { shopId: requestingShopId })
      .andWhere('cartItem.status IN (:...statuses)', { statuses })
      .orderBy('cartItem.updatedAt', 'DESC')
      .getMany();

    this.logger.log(
      `[findShopOrdersByStatus] Found ${items.length} items for shop ${requestingShopId}.`,
    );
    console.log('items cart : ', items);
    return items;
  }

  async getShopOrderStatusCounts(
    requestingShopId: number,
  ): Promise<{ [key in OrderStatus]?: number }> {
    this.logger.log(
      `[getShopOrderStatusCounts] Shop ${requestingShopId} fetching order status counts.`,
    );

    try {
      const countsResult = await this.cartItemRepository
        .createQueryBuilder('cartItem')
        .select('cartItem.status', 'status')
        .addSelect('COUNT(cartItem.id)', 'count')
        .where('cartItem.shopId = :shopId', { shopId: requestingShopId })
        .andWhere('cartItem.isPaid = :isPaid', { isPaid: true }) // Chỉ đếm đơn hàng đã thanh toán
        .andWhere('cartItem.status IS NOT NULL') // Chỉ đếm các trạng thái hợp lệ
        .groupBy('cartItem.status')
        .getRawMany();

      this.logger.log(
        `[getShopOrderStatusCounts] Raw counts result for shop ${requestingShopId}:`,
        countsResult,
      );

      const counts: { [key in OrderStatus]?: number } = {};
      for (const row of countsResult) {
        counts[row.status as OrderStatus] = parseInt(row.count, 10) || 0;
      }

      this.logger.log(
        `[getShopOrderStatusCounts] Processed counts for shop ${requestingShopId}:`,
        counts,
      );
      return counts;
    } catch (error) {
      this.logger.error(
        `[getShopOrderStatusCounts] Error fetching counts for shop ${requestingShopId}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Could not fetch shop order status counts',
      );
    }
  }
}
