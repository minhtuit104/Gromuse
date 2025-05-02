// src/modules/payment/dtos/create-payment.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { PaymentMethod } from '../../../typeorm/entities/Payment';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.COD })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 100.5 })
  @IsNotEmpty({ message: 'subtotal should not be empty' })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'subtotal must be a number conforming to the specified constraints',
    },
  )
  @Min(0, { message: 'subtotal must not be less than 0' })
  subtotal: number;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  deliveryFeeOriginal: number;

  @ApiProperty({ example: 15.0 })
  @IsNumber()
  deliveryFeeDiscounted: number;

  @ApiProperty({ example: 10.0, default: 0 })
  @IsNumber()
  @IsOptional()
  couponDiscount?: number;

  @ApiProperty({ example: 110.5 })
  @IsNumber()
  total: number;

  @ApiProperty({ example: '0987654321' })
  @IsNotEmpty({ message: 'phone should not be empty' })
  @IsString({ message: 'phone must be a string' })
  phone: string;

  @ApiProperty({ example: ['VOUCHER1', 'VOUCHER2'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  voucherCodes?: string[];

}
