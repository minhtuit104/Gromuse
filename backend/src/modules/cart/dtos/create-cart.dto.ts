import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class CreateCartDto {
  @ApiProperty({ example: 1, description: 'ID của sản phẩm để mua ngay' })
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 1, description: 'Số lượng sản phẩm để mua ngay' })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({
    example: 1,
    required: true,
    description: 'ID của người dùng (bắt buộc khi không dùng xác thực token)',
  })
  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber()
  userId: number;
}
