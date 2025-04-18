import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  // --- Các hàm xử lý CartItem ---

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
      // Lấy tất cả CartItem thuộc về cartId này, chỉ lấy những item chưa thanh toán
      const items = await this.cartItemRepository.find({
        where: {
          cart: { id: cartId },
          isPaid: false, // Chỉ lấy các item chưa thanh toán trong giỏ hàng
        },
        relations: ['product', 'product.category'], // Load các relations cần thiết
        order: { createdAt: 'ASC' }, // Sắp xếp theo thời gian tạo
      });

      this.logger.log(
        `[getCartItemsByCartId] Found ${items.length} unpaid items for cart ID ${cartId}.`,
      );
      // Log chi tiết nếu cần debug
      // this.logger.log(`[getCartItemsByCartId] Items: ${JSON.stringify(items, null, 2)}`);

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

      // Tìm các CartItem liên quan (có thể đã thanh toán hoặc chưa)
      const cartItems = await this.cartItemRepository.find({
        where: {
          cart: { id: cartId },
          product: { id: In(productIds) },
        },
        relations: ['product'], // Load product để cập nhật sold count
      });

      this.logger.log(
        `[updateItemsStatus] Found ${cartItems.length} CartItems matching product IDs to potentially update.`,
      );

      if (cartItems.length === 0) {
        this.logger.warn(
          `[updateItemsStatus] No matching CartItems found in cart ${cartId} for the provided product IDs.`,
        );
        // Có thể throw NotFoundException nếu yêu cầu phải tìm thấy item
        // throw new NotFoundException(`No matching items found in cart ${cartId}`);
        return {
          success: false,
          message: `Không tìm thấy sản phẩm phù hợp trong giỏ hàng ${cartId}.`,
          updatedProductsCount: 0,
          details: [],
        };
      }

      const updatedProductsInfo = [];
      const itemsToSave: CartItem[] = [];
      const productsToUpdate: Product[] = [];

      for (const cartItem of cartItems) {
        const matchedProductInfo = products.find(
          (p) => p.id === cartItem.productId,
        );

        if (matchedProductInfo) {
          const wasAlreadyPaid = cartItem.isPaid;
          this.logger.log(
            `[updateItemsStatus] Processing CartItem ID: ${cartItem.id} (productId: ${cartItem.productId}). Current isPaid: ${wasAlreadyPaid}. Setting isPaid to: ${isPaid}`,
          );

          // Chỉ cập nhật nếu trạng thái isPaid thay đổi
          if (cartItem.isPaid !== isPaid) {
            cartItem.isPaid = isPaid;
            if (isPaid) {
              // Đặt là TO_RECEIVE khi thanh toán thành công
              cartItem.status = OrderStatus.TO_RECEIVE;
            } else {
              // Nếu chuyển về chưa thanh toán (ít xảy ra), reset status
              cartItem.status = null;
              cartItem.cancelReason = null; // Xóa lý do hủy nếu có
            }
            itemsToSave.push(cartItem); // Thêm vào danh sách cần lưu
          } else if (isPaid && cartItem.status !== OrderStatus.TO_RECEIVE) {
            // Nếu đã paid nhưng status chưa đúng (ví dụ null), cập nhật status
            cartItem.status = OrderStatus.TO_RECEIVE;
            itemsToSave.push(cartItem);
          }

          // Chỉ cập nhật số lượng 'sold' của Product nếu chuyển từ chưa thanh toán -> đã thanh toán
          if (isPaid && !wasAlreadyPaid && cartItem.product) {
            this.logger.log(
              `[updateItemsStatus] Queuing sold count update for Product ID: ${cartItem.product.id}`,
            );
            const product = cartItem.product; // Đã load từ relation
            const currentSold =
              typeof product.sold === 'number' ? product.sold : 0;
            // Lấy quantity từ cartItem thay vì DTO để đảm bảo đúng số lượng thực tế trong giỏ
            const quantityToAdd =
              typeof cartItem.quantity === 'number' ? cartItem.quantity : 0;

            if (quantityToAdd > 0) {
              product.sold = currentSold + quantityToAdd;
              productsToUpdate.push(product); // Thêm vào danh sách product cần cập nhật
              updatedProductsInfo.push({
                id: product.id,
                newSoldCount: product.sold,
              });
            }
          }
        } else {
          this.logger.warn(
            `[updateItemsStatus] No matching product info found in DTO for CartItem ID: ${cartItem.id} (productId: ${cartItem.productId})`,
          );
        }
      }

      // Lưu tất cả thay đổi trong một transaction (nếu có thể) hoặc tuần tự
      if (itemsToSave.length > 0) {
        await this.cartItemRepository.save(itemsToSave);
        this.logger.log(
          `[updateItemsStatus] Saved ${itemsToSave.length} CartItems.`,
        );
      }
      if (productsToUpdate.length > 0) {
        await this.productRepository.save(productsToUpdate);
        this.logger.log(
          `[updateItemsStatus] Updated sold count for ${productsToUpdate.length} Products.`,
        );
      }

      return {
        success: true,
        message: isPaid
          ? 'Cập nhật trạng thái CartItem và số lượng Product thành công'
          : 'Cập nhật trạng thái CartItem chưa thanh toán',
        updatedProductsCount: updatedProductsInfo.length,
        details: updatedProductsInfo,
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
    cartId: number,
    productId: number,
    status: OrderStatus,
    cancelReason?: string,
  ): Promise<{
    success: boolean;
    message: string;
    updatedItem: CartItem | null;
  }> {
    this.logger.log(
      `[updateItemOrderStatus] Attempting update: cartId=${cartId}, productId=${productId}, status=${status}, reason=${cancelReason || 'N/A'}`,
    );

    // Tìm CartItem (nên tìm item đã thanh toán nếu logic yêu cầu)
    const cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { id: cartId },
        product: { id: productId },
        isPaid: true, // Chỉ cho phép cập nhật status của item đã thanh toán
      },
      relations: ['product', 'cart'], // Load relations cần thiết
    });

    if (!cartItem) {
      this.logger.warn(
        `[updateItemOrderStatus] Paid CartItem not found for cartId=${cartId}, productId=${productId}`,
      );
      throw new NotFoundException(
        'Paid order item not found in the specified cart',
      );
    }

    const currentStatus = cartItem.status;
    this.logger.log(
      `[updateItemOrderStatus] Found CartItem ID: ${cartItem.id}. Current status: ${currentStatus}. New status: ${status}`,
    );

    // --- Logic kiểm tra chuyển đổi trạng thái ---
    // Chỉ cho phép chuyển thành COMPLETE nếu đang là TO_RECEIVE
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
        updatedItem: cartItem, // Trả về item hiện tại
      };
    }

    // Chỉ cho phép hủy (CANCEL_BYUSER/CANCEL_BYSHOP) nếu đang là TO_RECEIVE
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
    // --- Kết thúc Logic kiểm tra ---

    // Cập nhật trạng thái
    cartItem.status = status;

    // Thêm/Xóa lý do hủy
    if (
      (status === OrderStatus.CANCEL_BYUSER ||
        status === OrderStatus.CANCEL_BYSHOP) &&
      cancelReason &&
      cancelReason.trim()
    ) {
      cartItem.cancelReason = cancelReason.trim();
      this.logger.log(
        `[updateItemOrderStatus] Setting cancel reason for CartItem ID: ${cartItem.id}`,
      );
    } else if (
      status !== OrderStatus.CANCEL_BYUSER &&
      status !== OrderStatus.CANCEL_BYSHOP
    ) {
      // Xóa lý do nếu trạng thái không phải là hủy
      cartItem.cancelReason = null;
    }

    // Lưu thay đổi
    try {
      const savedItem = await this.cartItemRepository.save(cartItem);
      this.logger.log(
        `[updateItemOrderStatus] Successfully updated CartItem ID: ${savedItem.id} to status: ${savedItem.status}`,
      );
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

  // Có thể thêm các hàm khác nếu cần, ví dụ:
  // async getItemById(itemId: number): Promise<CartItem> { ... }
  // async deleteItemById(itemId: number): Promise<void> { ... }
}
