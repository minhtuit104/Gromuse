import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Put,
  HttpStatus,
  HttpException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateCartItemsStatusDto } from './dtos/update-cart-items-status';
import { CreateCartDto } from './dtos/create-cart.dto';
import { OrderStatus } from '../../typeorm/entities/CartItem';
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';

@ApiTags('cart')
@Controller('cart') // Thay đổi từ 'api/cart' thành 'cart' để khớp với frontend
export class CartController {
  constructor(private readonly cartService: CartService) {}

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

  // Endpoint hiện có: Lấy danh sách sản phẩm trong giỏ hàng
  @Get(':id')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm trong giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách sản phẩm trong giỏ hàng',
  })
  async getCartItems(@Param('id') cartId: string) {
    return this.cartService.getCartItems(+cartId);
  }

  // Endpoint mới: Cập nhật số lượng sản phẩm trong giỏ hàng
  @Patch(':cartId/items/:productId')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng' })
  @ApiResponse({
    status: 200,
    description: 'Số lượng sản phẩm đã được cập nhật',
  })
  async updateCartItemQuantity(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateCartItemQuantity(
      +cartId,
      +productId,
      quantity,
    );
  }

  // Thêm endpoint để cập nhật trạng thái đơn hàng
  @Put(':cartId/items/:productId/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái đơn hàng thành công',
  })
  async updateOrderStatus(
    @Param('cartId') cartId: string,
    @Param('productId') productId: string,
    @Body('status') status: OrderStatus,
    @Body('cancelReason') cancelReason?: string,
  ) {
    return this.cartService.updateOrderStatus(
      +cartId,
      +productId,
      status,
      cancelReason,
    );
  }

  @Put(':cartId/update-cart-items-status')
  @ApiOperation({
    summary:
      'Cập nhật trạng thái thanh toán của CartItem và cập nhật số lượng sản phẩm',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái CartItem và số lượng Product thành công',
  })
  async updateCartItemsStatus(
    @Param('cartId') cartId: string,
    @Body() updateDto: UpdateCartItemsStatusDto,
  ) {
    return this.cartService.updateCartItemsStatus(
      +cartId,
      updateDto.isPaid,
      updateDto.products,
    );
  }

  @Post('/buy-now')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo giỏ hàng để mua ngay' })
  async createBuyNowCart(
    @Body() createCartDto: CreateCartDto /*, @Req() req */,
  ) {
    try {
      // --- LẤY userId TỪ BODY (DTO) THAY VÌ req.user ---
      // const user = req.user;
      // createCartDto.userId = user.idUser; // Dòng này không cần nữa nếu DTO đã có userId

      // Kiểm tra xem DTO có userId không (được gửi từ frontend)
      if (!createCartDto.userId) {
        throw new HttpException(
          'userId is required in the request body',
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log('Nhận được dữ liệu Buy Now:', createCartDto);
      const cart = await this.cartService.createBuyNowCart(createCartDto);
      return {
        success: true,
        cartId: cart.id,
        message: 'Đã tạo giỏ hàng để mua ngay',
      };
    } catch (error) {
      // Ném lại lỗi từ service hoặc lỗi kiểm tra userId
      if (error instanceof HttpException) {
        throw error;
      }
      // Xử lý lỗi chung khác
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR, // Hoặc BAD_REQUEST tùy ngữ cảnh lỗi
          error: 'Lỗi khi tạo giỏ hàng mua ngay',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR, // Hoặc BAD_REQUEST
      );
    }
  }
}
