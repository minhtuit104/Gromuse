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
import { CreateCartDto } from './dtos/cart.dto';
import { AddToCartDto } from './dtos/add-to-cart.dto';
// import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard'; // Giữ lại nếu dùng
import { CartItemService } from '../cart_item/cartItem.service';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(
    private readonly cartService: CartService,
    private readonly cartItemService: CartItemService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo cart mới' })
  @ApiResponse({ status: 201, description: 'Tạo cart thành công' })
  async create(@Body() createCartItemDto: CreateCartDto) {
    const payment = await this.cartService.create(createCartItemDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Payment created successfully',
      data: payment,
    };
  }

  @Post('add')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiResponse({
    status: 201,
    description: 'Sản phẩm đã được thêm vào giỏ hàng',
  })
  async addToCart(@Body() addToCartDto: AddToCartDto) {
    if (!addToCartDto.userId) {
      throw new HttpException(
        'userId is required in the request body',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.cartService.addToCart(addToCartDto);
  }

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

  
  
}
