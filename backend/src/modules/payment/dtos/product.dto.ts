import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class ProductDto {
  @ApiProperty({ example: 1, description: 'ID của sản phẩm' })
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'Product Name', description: 'Tên sản phẩm' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL ảnh sản phẩm',
  })
  @IsNotEmpty()
  @IsString()
  img: string;

  @ApiProperty({ example: 'Product Title', description: 'Tiêu đề sản phẩm' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 0.5, description: 'Trọng lượng sản phẩm' })
  @IsNotEmpty()
  @IsNumber()
  weight: number;

  @ApiProperty({ example: 10.99, description: 'Giá sản phẩm' })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ example: 2, description: 'Số lượng sản phẩm' })
  @IsNotEmpty()
  @IsNumber()
  amount: number;
}
