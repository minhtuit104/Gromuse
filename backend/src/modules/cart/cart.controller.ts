import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpStatus,
  HttpException,
  UseGuards, // Giữ lại nếu cần xác thực
  Logger,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateCartDto } from './dtos/create-cart.dto';
// import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard'; // Giữ lại nếu dùng
import { CartItemService } from '../cart_item/cartItem.service';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(
    private readonly cartService: CartService,
    private readonly cartItemService: CartItemService, // Inject CartItemService
  ) {}

  // Endpoint để lấy hoặc tạo giỏ hàng cho user (ví dụ)
  @Get('user/:userId')
  @ApiOperation({ summary: 'Lấy hoặc tạo giỏ hàng cho người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin giỏ hàng của người dùng',
  })
  // @UseGuards(JwtAuthGuard) // Bảo vệ nếu cần
  async getUserCart(@Param('userId') userId: string /*, @Req() req */) {
    // // Nếu dùng Guard, có thể lấy userId từ req.user
    // const userIdFromToken = req.user?.idUser;
    // if (!userIdFromToken || +userId !== userIdFromToken) {
    //     throw new HttpException('Unauthorized access to cart', HttpStatus.FORBIDDEN);
    // }
    this.logger.log(`[GET /cart/user/:userId] Request for userId: ${userId}`);
    if (isNaN(+userId)) {
      throw new HttpException('Invalid userId', HttpStatus.BAD_REQUEST);
    }
    return this.cartService.getOrCreateUserCart(+userId);
  }

  @Post('/buy-now')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo giỏ hàng và thêm sản phẩm để mua ngay' })
  @ApiResponse({
    status: 201,
    description: 'Đã tạo giỏ hàng và thêm sản phẩm mua ngay',
    schema: { example: { success: true, cartId: 1, cartItemId: 5 } },
  })
  async createBuyNowCart(@Body() createCartDto: CreateCartDto) {
    this.logger.log(
      `[POST /cart/buy-now] Received DTO: ${JSON.stringify(createCartDto)}`,
    );
    try {
      if (!createCartDto.userId) {
        throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
      }
      if (isNaN(createCartDto.productId) || createCartDto.productId <= 0) {
        throw new HttpException('Invalid productId', HttpStatus.BAD_REQUEST);
      }
      if (isNaN(createCartDto.quantity) || createCartDto.quantity <= 0) {
        throw new HttpException('Invalid quantity', HttpStatus.BAD_REQUEST);
      }

      const cart = await this.cartService.createBuyNowCart(
        createCartDto.userId,
        createCartDto.productId,
      );
      this.logger.log(`[POST /cart/buy-now] Cart created with ID: ${cart.id}`);

      const cartItem = await this.cartItemService.addBuyNowItem(
        cart.id,
        createCartDto.productId,
        createCartDto.quantity,
      );
      this.logger.log(
        `[POST /cart/buy-now] CartItem added with ID: ${cartItem.id}`,
      );

      return {
        success: true,
        cartId: cart.id,
        cartItemId: cartItem.id, // Trả về ID của item vừa thêm
        message: 'Đã tạo giỏ hàng và thêm sản phẩm để mua ngay',
      };
    } catch (error) {
      this.logger.error(
        `[POST /cart/buy-now] Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Lỗi khi tạo giỏ hàng mua ngay',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
