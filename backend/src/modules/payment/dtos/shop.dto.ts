// src/modules/payment/dtos/shop.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductDto } from './product.dto';

export class ShopDto {
  @ApiProperty({ example: 1, description: 'ID (number) của cửa hàng' }) // *** Sửa example ***
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @ApiProperty({ example: "Lay's Việt Nam", description: 'Tên cửa hàng' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: '../../assets/images/imagePNG/Avatar.png',
    description: 'URL ảnh đại diện của cửa hàng',
  })
  @IsNotEmpty()
  @IsString()
  avatar: string;

  @ApiProperty({
    example: 'Delivery in 15 minutes ago',
    description: 'Thông tin giao hàng',
    required: false,
  })
  @IsOptional()
  @IsString()
  deliveryInfo?: string;

  @ApiProperty({
    example: true,
    description: 'Hiển thị icon sản phẩm hay không',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  productIcons?: boolean;

  @ApiProperty({
    type: [ProductDto],
    description: 'Danh sách sản phẩm của cửa hàng trong đơn hàng này',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductDto)
  products: ProductDto[];
}
