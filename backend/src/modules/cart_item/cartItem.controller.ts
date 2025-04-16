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
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaymentStatus } from '../../typeorm/entities/Payment';
import { CreateCartItemDto } from './dtos/cart_item.dto';
import { CartItemService } from './cartItem.service';

@ApiTags('cart-item')
@Controller('cart-item')
export class CartItemController {
  constructor(private readonly cartItemService: CartItemService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo cart item mới' })
  @ApiResponse({ status: 201, description: 'Tạo cart item thành công' })
  async create(@Body() createCartItemDto: CreateCartItemDto) {
    const payment = await this.cartItemService.create(createCartItemDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Payment created successfully',
      data: payment,
    };
  }
}
