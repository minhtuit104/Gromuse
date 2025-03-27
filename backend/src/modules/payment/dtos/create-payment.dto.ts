import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../typeorm/entities/Payment';
import { AddressDto } from './address.dto';
import { ShopDto } from './shop.dto';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.COD })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ example: 35.75 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ example: 25.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  deliveryFeeOriginal: number;

  @ApiProperty({ example: 15.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  deliveryFeeDiscounted: number;

  @ApiProperty({ example: 10.75 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  couponDiscount: number;

  @ApiProperty({ example: 40.0 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({ type: AddressDto })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({ type: [ShopDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShopDto)
  shops: ShopDto[];

  @ApiProperty({ example: ['#FREE20', '#DISCOUNT10'], required: false })
  @IsOptional()
  @IsArray()
  voucherCodes?: string[];

  @ApiProperty({ example: 1, description: 'ID của giỏ hàng', required: true })
  @IsNotEmpty()
  @IsNumber()
  cartId: number;
}
