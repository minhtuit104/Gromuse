import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @ApiProperty({ example: 1, description: 'ID của sản phẩm cần thêm' })
  @IsNotEmpty({ message: 'productId không được để trống' })
  @IsNumber({}, { message: 'productId phải là một số' })
  productId: number;

  @ApiProperty({ example: 1, description: 'Số lượng sản phẩm cần thêm' })
  @IsNotEmpty({ message: 'quantity không được để trống' })
  @IsNumber({}, { message: 'quantity phải là một số' })
  @Min(1, { message: 'Số lượng phải lớn hơn hoặc bằng 1' })
  quantity: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID của giỏ hàng (nếu là giỏ hàng ẩn danh đã có)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'cartId phải là một số (nếu được cung cấp)' })
  cartId?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ID của người dùng (nếu thêm vào giỏ hàng của user)',
  })
  @IsOptional()
  @IsNumber({}, { message: 'userId phải là một số (nếu được cung cấp)' })
  userId?: number;
}
