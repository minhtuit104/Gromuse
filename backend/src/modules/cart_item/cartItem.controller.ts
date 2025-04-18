import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Put,
  HttpStatus,
  HttpException,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { CartItemService } from './cartItem.service';
import { AddToCartDto } from '../cart/dtos/add-to-cart.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { UpdateCartItemsStatusDto } from '../cart/dtos/update-cart-items-status';
import { OrderStatus } from '../../typeorm/entities/CartItem';
import {
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
// import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard'; // Nếu cần

class UpdateQuantityDto {
  @ApiProperty({ example: 2, description: 'Số lượng mới của sản phẩm' })
  @IsNumber()
  @Min(0, { message: 'Quantity cannot be negative. Use 0 to remove.' }) // Cho phép 0 để xóa
  quantity: number;
}

class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.COMPLETE,
    description: 'Trạng thái mới của đơn hàng',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({
    example: 'Khách hàng yêu cầu hủy',
    required: false,
    description: 'Lý do hủy (nếu có)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  cancelReason?: string;
}

@ApiTags('cart-items')
@Controller('cart-items')
export class CartItemController {
  private readonly logger = new Logger(CartItemController.name);

  constructor(private readonly cartItemService: CartItemService) {}

  @Post()
  // @UseGuards(JwtAuthGuard) // Bảo vệ nếu cần
  @ApiOperation({
    summary: 'Thêm sản phẩm vào giỏ hàng (hoặc cập nhật số lượng)',
  })
  @ApiResponse({
    status: 201,
    description: 'Sản phẩm đã được thêm/cập nhật trong giỏ hàng',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({
    status: 404,
    description: 'Sản phẩm hoặc Giỏ hàng không tồn tại',
  })
  async addItemToCart(@Body() addToCartDto: AddToCartDto /*, @Req() req */) {
    this.logger.log(
      `[POST /cart-items] Received DTO: ${JSON.stringify(addToCartDto)}`,
    );
    // // Nếu dùng Guard, có thể lấy userId từ req.user và ghi đè DTO
    // const userIdFromToken = req.user?.idUser;
    // if (userIdFromToken) {
    //     addToCartDto.userId = userIdFromToken;
    //     delete addToCartDto.cartId; // Ưu tiên userId nếu có token
    // } else if (!addToCartDto.userId && !addToCartDto.cartId) {
    //     // Nếu không có token và cũng không có userId/cartId trong DTO
    //     throw new HttpException('userId hoặc cartId là bắt buộc', HttpStatus.BAD_REQUEST);
    // }
    if (!addToCartDto.userId && !addToCartDto.cartId) {
      // Nếu không có userId và cartId, CartItemService sẽ tự tạo cart ẩn danh
      this.logger.log(
        '[POST /cart-items] No userId or cartId provided, creating/using anonymous cart.',
      );
    } else if (addToCartDto.userId) {
      this.logger.log(
        `[POST /cart-items] Using userId: ${addToCartDto.userId}`,
      );
    } else {
      this.logger.log(
        `[POST /cart-items] Using cartId: ${addToCartDto.cartId}`,
      );
    }

    try {
      const result = await this.cartItemService.addItemToCart(addToCartDto);
      return result; // Trả về CartItem đã được thêm/cập nhật
    } catch (error) {
      this.logger.error(
        `[POST /cart-items] Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Lỗi khi thêm vào giỏ hàng',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('cart/:cartId')
  @ApiOperation({
    summary: 'Lấy danh sách sản phẩm chưa thanh toán trong giỏ hàng',
  })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm' })
  @ApiResponse({ status: 404, description: 'Giỏ hàng không tồn tại' })
  async getCartItems(@Param('cartId', ParseIntPipe) cartId: number) {
    this.logger.log(
      `[GET /cart-items/cart/:cartId] Request for cartId: ${cartId}`,
    );
    return this.cartItemService.getCartItemsByCartId(cartId);
  }

  // PATCH /cart-items/cart/:cartId/product/:productId - Cập nhật số lượng item
  @Patch('cart/:cartId/product/:productId')
  @ApiOperation({
    summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng (chưa thanh toán)',
  })
  @ApiResponse({
    status: 200,
    description:
      'Số lượng đã được cập nhật (trả về item) hoặc item đã bị xóa (trả về null)',
  })
  @ApiResponse({
    status: 404,
    description:
      'Giỏ hàng hoặc sản phẩm trong giỏ không tồn tại (hoặc đã thanh toán)',
  })
  async updateCartItemQuantity(
    @Param('cartId', ParseIntPipe) cartId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateQuantityDto: UpdateQuantityDto, // Sử dụng DTO mới
  ) {
    this.logger.log(
      `[PATCH /cart-items/cart/:cartId/product/:productId] cartId=${cartId}, productId=${productId}, quantity=${updateQuantityDto.quantity}`,
    );
    const result = await this.cartItemService.updateItemQuantity(
      cartId,
      productId,
      updateQuantityDto.quantity,
    );
    // Nếu result là null (item bị xóa), trả về 204 No Content hoặc 200 OK với body rỗng/thông báo
    if (result === null) {
      // throw new HttpException('Item removed', HttpStatus.OK); // Hoặc trả về status 204
      return { message: 'Item removed successfully' }; // Trả về 200 với message
    }
    return result; // Trả về item đã cập nhật
  }

  // DELETE /cart-items/cart/:cartId - Xóa tất cả item chưa thanh toán khỏi giỏ hàng
  @Delete('cart/:cartId')
  @ApiOperation({
    summary: 'Xóa tất cả sản phẩm chưa thanh toán khỏi giỏ hàng',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã xóa các sản phẩm chưa thanh toán',
  })
  @ApiResponse({ status: 404, description: 'Giỏ hàng không tồn tại' })
  async clearCart(@Param('cartId', ParseIntPipe) cartId: number) {
    this.logger.log(
      `[DELETE /cart-items/cart/:cartId] Request for cartId: ${cartId}`,
    );
    const result = await this.cartItemService.clearUnpaidItems(cartId);
    return {
      message: `Đã xóa ${result.affected || 0} sản phẩm chưa thanh toán.`,
    };
  }

  @Put('cart/:cartId/status')
  @ApiOperation({
    summary:
      'Cập nhật trạng thái thanh toán (isPaid) và số lượng bán (sold) cho các sản phẩm trong giỏ hàng',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Giỏ hàng không tồn tại' })
  async updateCartItemsStatus(
    @Param('cartId', ParseIntPipe) cartId: number,
    @Body() updateDto: UpdateCartItemsStatusDto,
  ) {
    this.logger.log(
      `[PUT /cart-items/cart/:cartId/status] cartId=${cartId}, isPaid=${updateDto.isPaid}, products=${JSON.stringify(updateDto.products)}`,
    );
    return this.cartItemService.updateItemsStatus(
      cartId,
      updateDto.isPaid,
      updateDto.products,
    );
  }

  @Put('cart/:cartId/product/:productId/order-status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái của một mục đơn hàng đã thanh toán',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({
    status: 400,
    description: 'Chuyển đổi trạng thái không hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Mục đơn hàng không tồn tại (hoặc chưa thanh toán)',
  })
  async updateOrderStatus(
    @Param('cartId', ParseIntPipe) cartId: number,
    @Param('productId', ParseIntPipe) productId: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto, // Sử dụng DTO mới
  ) {
    this.logger.log(
      `[PUT /cart-items/cart/:cartId/product/:productId/order-status] cartId=${cartId}, productId=${productId}, status=${updateOrderStatusDto.status}, reason=${updateOrderStatusDto.cancelReason}`,
    );
    return this.cartItemService.updateItemOrderStatus(
      cartId,
      productId,
      updateOrderStatusDto.status,
      updateOrderStatusDto.cancelReason,
    );
  }

  // Có thể thêm endpoint DELETE /cart-items/:itemId để xóa theo ID của CartItem nếu cần
  // @Delete(':itemId')
  // @ApiOperation({ summary: 'Xóa một mục cụ thể khỏi giỏ hàng bằng ID của nó' })
  // async deleteItemById(@Param('itemId', ParseIntPipe) itemId: number) {
  //     // Cần thêm logic vào CartItemService để xóa theo itemId
  //     // await this.cartItemService.deleteItemById(itemId);
  //     // return { message: `Item with ID ${itemId} deleted.` };
  // }
}
