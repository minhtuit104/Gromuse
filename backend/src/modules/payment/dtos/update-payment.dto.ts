import { PartialType } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {}

export class ApplyVoucherDto {
  @ApiProperty({ example: '#FREE20' })
  @IsNotEmpty()
  @IsString()
  code: string;
}
