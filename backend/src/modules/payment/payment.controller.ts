// src/modules/payment/payment.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dtos/create-payment.dto';
import { ApplyVoucherDto, UpdatePaymentDto } from './dtos/update-payment.dto';
import { UpdateProductAmountDto } from './dtos/update-product-amount.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentStatus } from '../../typeorm/entities/Payment';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

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

  @Post('update-product-amount')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật số lượng sản phẩm thành công',
  })
  updateProductAmount(@Body() updateProductAmountDto: UpdateProductAmountDto) {
    return this.paymentService.updateProductAmount(
      updateProductAmountDto.productId,
      updateProductAmountDto.amount,
    );
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
  @ApiOperation({ summary: 'Tạo đơn thanh toán trực tiếp' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    const payment =
      await this.paymentService.createDirectPayment(createPaymentDto);

    // Cập nhật paymentId cho các CartItem
    await this.paymentService.updateCartItemsWithPayment(
      createPaymentDto.cartId,
      payment.id,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Payment created successfully',
      data: payment,
    };
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
