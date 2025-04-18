import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 1, description: 'ID của sản phẩm cần thêm' })
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 1, description: 'Số lượng sản phẩm cần thêm' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'ID của giỏ hàng (nếu là giỏ hàng ẩn danh đã có)',
  })
  @IsOptional()
  @IsNumber()
  cartId?: number;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'ID của người dùng (nếu thêm vào giỏ hàng của user)',
  })
  @IsOptional()
  @IsNumber()
  userId?: number;
}
