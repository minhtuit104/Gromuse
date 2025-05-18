// src/modules/payment/payment.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaymentStatus } from '../../typeorm/entities/Payment';
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';
import { CartService } from '../cart/cart.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { ApplyVoucherDto, UpdatePaymentDto } from './dtos/update-payment.dto';
import { PaymentService } from './payment.service';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly cartService: CartService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo đơn thanh toán mới' })
  @ApiResponse({ status: 201, description: 'Tạo đơn thanh toán thành công' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    const payment = await this.paymentService.create(createPaymentDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Payment created successfully',
      data: payment,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đơn thanh toán' })
  @ApiResponse({ status: 200, description: 'Danh sách đơn thanh toán' })
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('status') status?: PaymentStatus,
  ) {
    return this.paymentService.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin đơn thanh toán theo ID' })
  @ApiResponse({ status: 200, description: 'Thông tin đơn thanh toán' })
  findOne(@Param('id') id: number) {
    return this.paymentService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật đơn thanh toán' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật đơn thanh toán thành công',
  })
  update(@Param('id') id: number, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hủy đơn thanh toán' })
  @ApiResponse({ status: 200, description: 'Hủy đơn thanh toán thành công' })
  remove(@Param('id') id: number) {
    return this.paymentService.remove(id);
  }

  @Post('apply-voucher')
  @ApiOperation({ summary: 'Áp dụng mã giảm giá' })
  @ApiResponse({ status: 200, description: 'Áp dụng mã giảm giá thành công' })
  applyVoucher(@Body() applyVoucherDto: ApplyVoucherDto) {
    return this.paymentService.applyVoucher(applyVoucherDto.code);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn thanh toán' })
  @ApiResponse({ status: 200, description: 'Hủy đơn thanh toán thành công' })
  cancelPayment(@Param('id') id: number) {
    return this.paymentService.cancelPayment(id);
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Xử lý đơn thanh toán' })
  @ApiResponse({ status: 200, description: 'Xử lý đơn thanh toán thành công' })
  processPayment(@Param('id') id: number) {
    return this.paymentService.processPayment(id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Hoàn thành đơn thanh toán' })
  @ApiResponse({
    status: 200,
    description: 'Hoàn thành đơn thanh toán thành công',
  })
  completePayment(@Param('id') id: number) {
    return this.paymentService.completePayment(id);
  }

  @Get('vouchers/available')
  @ApiOperation({ summary: 'Lấy danh sách mã giảm giá có sẵn' })
  @ApiResponse({ status: 200, description: 'Danh sách mã giảm giá' })
  getAvailableVouchers() {
    return this.paymentService.getAvailableVouchers();
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Tạo đơn thanh toán tự động sử dụng giỏ hàng của người dùng đăng nhập',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Đơn thanh toán đã được tạo thành công',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Không có quyền truy cập (thiếu token)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy giỏ hàng cho người dùng',
  })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto, @Req() req) {
    console.log('Received request to /payment/create:', createPaymentDto);

    const userId = req.user.idUser;

    try {
      // Luôn lấy giỏ hàng hiện tại của người dùng
      const userCart = await this.cartService.getOrCreateUserCart(userId);

      if (!userCart) {
        throw new NotFoundException('Không tìm thấy giỏ hàng cho người dùng.');
      }

      // Tạo một phiên bản DTO với cartId
      const paymentDtoWithCartId = {
        ...createPaymentDto,
        cartId: userCart.id,
      };

      const payment =
        await this.paymentService.createDirectPayment(paymentDtoWithCartId);
      // console.log('Payment record created:', payment);

      // Cập nhật các cartItem với payment mới
      await this.paymentService.updateCartItemsWithPayment(
        userCart.id,
        payment.id,
      );
      // console.log(
      //   `Associated cart items from cart ${userCart.id} with payment ${payment.id}`,
      // );

      return {
        statusCode: HttpStatus.CREATED,
        message: 'success',
        data: payment,
      };
    } catch (error) {
      console.error(
        `Error in payment creation process for user ${userId}:`,
        error,
      );

      if (error instanceof NotFoundException) {
        throw error; // Trả về lỗi 404 nếu không tìm thấy cart
      }

      throw new InternalServerErrorException(
        'Đã xảy ra lỗi khi tạo đơn thanh toán.',
      );
    }
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Xác nhận thanh toán' })
  @ApiResponse({ status: 200, description: 'Xác nhận thanh toán thành công' })
  async confirmPayment(@Param('id') id: number) {
    const payment = await this.paymentService.confirmPayment(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Payment confirmed successfully',
      data: payment,
    };
  }
}
