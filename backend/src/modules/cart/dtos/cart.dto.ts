import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateCartDto {
  @ApiProperty({ example: 1, description: 'ID của người dùng', required: true })
  @IsNotEmpty()
  @IsNumber()
  idUser: number;

  @ApiProperty({ example: 1, description: 'ID của sản phẩm', required: true })
  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @ApiProperty({ example: 1, description: 'Số lượng sản phẩm', required: true })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;
}
