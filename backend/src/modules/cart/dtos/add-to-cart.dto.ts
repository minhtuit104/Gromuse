import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'ID của giỏ hàng (nếu có và không dùng userId)',
  })
  @IsOptional()
  @IsNumber()
  cartId?: number;

  @ApiProperty({
    example: 1,
    required: true,
    description: 'ID của người dùng (bắt buộc khi không dùng xác thực token)',
  })
  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber()
  userId: number;

  // @ApiProperty({ description: 'Trạng thái thanh toán' })
  // @IsBoolean()
  // @IsOptional()
  // isPaid?: boolean = false;
}

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1)
  quantity: number;
}
