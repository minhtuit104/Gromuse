import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  Min,
  IsOptional,
  IsDate,
} from 'class-validator';
import { VoucherType } from '../../../typeorm/entities/Voucher';
import { Type } from 'class-transformer';

export class VoucherDto {
  @ApiProperty({ enum: VoucherType, example: VoucherType.FREE_SHIP })
  @IsNotEmpty()
  @IsEnum(VoucherType)
  type: VoucherType;

  @ApiProperty({ example: '#FREE20' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ example: 'Miễn phí vận chuyển lên đến 20$' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 10 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  remaining: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Min(0)
  minOrderValue: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(0)
  maxDiscountValue: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}
