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
  Query,
  ParseArrayPipe,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { CartItemService } from './cartItem.service';
import { AddToCartDto } from '../cart/dtos/add-to-cart.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiProperty,
  ApiBearerAuth,
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
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';
// import { UserService } from '../users/user.service';

class UpdateQuantityDto {
  @ApiProperty({ example: 2, description: 'Số lượng mới của sản phẩm' })
  @IsNumber()
  @Min(0, { message: 'Quantity cannot be negative. Use 0 to remove.' })
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

interface RequestWithUser extends Request {
  user: { idUser: number };
  // user: {
  //   idUser: number;
  //   role: number;
  // };
}

@ApiTags('cart-items')
@Controller('api/cart-items')
export class CartItemController {
  private readonly logger = new Logger(CartItemController.name);

  constructor(private readonly cartItemService: CartItemService) {}

  // constructor(
  //   private readonly cartItemService: CartItemService,
  //   private readonly userService: UserService,
  // ) {}

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

  @Get('cart')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Lấy danh sách sản phẩm chưa thanh toán trong giỏ hàng của người dùng hiện tại',
  })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm' })
  @ApiResponse({ status: 404, description: 'Giỏ hàng không tồn tại' })
  @ApiBearerAuth()
  async getCartItems(@Req() req) {
    const user = req.user;
    console.log(user);
    // Tìm giỏ hàng bằng id của người dùng (idUser)
    const cart = await this.cartItemService.getCartById(user.idUser);
    console.log(cart);
    if (!cart) {
      throw new NotFoundException('Giỏ hàng không tồn tại');
    }

    const items = await this.cartItemService.getCartItemsByCartId(cart.id);

    return {
      message: 'success',
      data: items,
    };
  }

  // @Patch('cart/:cartId/product/:productId')
  @Patch(':cartItemId')
  @ApiOperation({
    summary: 'Cập nhật số lượng của một mục trong giỏ hàng bằng CartItem ID',
  })
  @ApiResponse({ status: 200, description: 'Số lượng đã được cập nhật' })
  @ApiResponse({
    status: 404,
    description: 'Mục giỏ hàng không tồn tại (hoặc đã thanh toán)',
  })
  async updateCartItemQuantityById(
    // <<< Đổi tên hàm cho rõ ràng
    @Param('cartItemId', ParseIntPipe) cartItemId: number, // <<< Nhận cartItemId
    @Body() updateQuantityDto: UpdateQuantityDto,
  ) {
    this.logger.log(
      `[PATCH /cart-items/:cartItemId] cartItemId=${cartItemId}, quantity=${updateQuantityDto.quantity}`,
    );
    // Gọi service với cartItemId
    const result = await this.cartItemService.updateItemQuantity(
      cartItemId,
      updateQuantityDto.quantity,
    );
    if (result === null) {
      return { message: 'Item removed successfully' };
    }
    return result;
  }

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
      `[PUT /cart-items/cart/:cartId/status] cartId=${cartId}, isPaid=${updateDto.isPaid}, cartItemIds=${JSON.stringify(updateDto.cartItemIds)}`,
    );
    return this.cartItemService.updateItemsStatus(
      cartId,
      updateDto.isPaid,
      updateDto.cartItemIds,
    );
  }

  @Put(':cartItemId/order-status')
  @ApiOperation({
    summary:
      'Cập nhật trạng thái của một mục đơn hàng đã thanh toán bằng CartItemID',
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
    @Param('cartItemId', ParseIntPipe) cartItemId: number, // *** DÙNG cartItemId ***
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    // @Req() req // Nếu cần kiểm tra quyền sở hữu trước khi cập nhật
  ) {
    this.logger.log(
      `[PUT /cart-items/:cartItemId/order-status] cartItemId=${cartItemId}, status=${updateOrderStatusDto.status}, reason=${updateOrderStatusDto.cancelReason}`,
    );
    // const loggedInUserId = req.user?.idUser; // Ví dụ lấy user id
    // const userRole = req.user?.role; // Ví dụ lấy role

    // Gọi service function đã sửa đổi
    return this.cartItemService.updateItemOrderStatus(
      cartItemId, // *** TRUYỀN cartItemId ***
      updateOrderStatusDto.status,
      updateOrderStatusDto.cancelReason,
      // loggedInUserId, // Truyền thêm nếu cần kiểm tra quyền
      // userRole
    );
  }

  @Get('paid/by-status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy danh sách các mục đơn hàng đã thanh toán theo trạng thái',
  })
  @ApiResponse({ status: 200, description: 'Danh sách các mục đơn hàng' })
  async getPaidItemsByStatus(
    @Req() req: RequestWithUser,
    @Query('statuses', new ParseArrayPipe({ items: String, separator: ',' }))
    statuses: OrderStatus[],
  ) {
    this.logger.log(
      `[GET /cart-items/paid/by-status] Request for statuses: ${statuses} by user: ${req.user['idUser']}`,
    );

    const loggedInUserId = req.user['idUser'];
    if (!loggedInUserId) {
      this.logger.error(
        '[GET /cart-items/paid/by-status] User ID not found in token payload after guard.',
      );
      throw new HttpException(
        'Unauthorized: User ID not found in token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.cartItemService.findPaidItemsByStatus(statuses, loggedInUserId);
  }

  @Get('count')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Lấy số lượng sản phẩm chưa thanh toán trong giỏ hàng của người dùng hiện tại',
  })
  @ApiResponse({ status: 200, description: 'Số lượng sản phẩm' })
  @ApiBearerAuth()
  async getUnpaidCartItemsCount(@Req() req) {
    const user = req.user;
    this.logger.log(
      `[GET /cart-items/count] Counting unpaid items for user: ${user.idUser}`,
    );

    const count = await this.cartItemService.getUnpaidCartItemsCount(
      user.idUser,
    );

    return {
      message: 'success',
      data: count,
    };
  }
}
