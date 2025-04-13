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
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UpdateCartItemsStatusDto } from './dtos/update-cart-items-status';
import { CreateCartDto } from './dtos/create-cart.dto';
import { OrderStatus } from '../../typeorm/entities/CartItem';

@ApiTags('cart')
@Controller('cart') // Thay đổi từ 'api/cart' thành 'cart' để khớp với frontend
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Endpoint hiện có: Thêm sản phẩm vào giỏ hàng
  @Post('add')
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiResponse({
    status: 201,
    description: 'Sản phẩm đã được thêm vào giỏ hàng',
  })
  async addToCart(@Body() addToCartDto: AddToCartDto) {
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

  // Endpoint cập nhật trạng thái CartItem và số lượng Product
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
  @ApiOperation({ summary: 'Tạo giỏ hàng để mua ngay' })
  async createBuyNowCart(@Body() createCartDto: CreateCartDto) {
    try {
      console.log('Nhận được dữ liệu Buy Now:', createCartDto);
      const cart = await this.cartService.createBuyNowCart(createCartDto);
      return {
        success: true,
        cartId: cart.id,
        message: 'Đã tạo giỏ hàng để mua ngay',
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Lỗi khi tạo giỏ hàng',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
