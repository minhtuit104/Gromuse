// src/modules/cart/dtos/update-cart-items-status.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductUpdateDto {
  @ApiProperty({ description: 'ID của sản phẩm' })
  @IsNumber()
  id: number;

  @ApiProperty({ description: 'Số lượng sản phẩm được mua' })
  @IsNumber()
  quantity: number;
}

export class UpdateCartItemsStatusDto {
  @ApiProperty({ description: 'Trạng thái thanh toán của CartItem' })
  @IsBoolean()
  isPaid: boolean;

  @ApiProperty({
    description: 'Danh sách sản phẩm cần cập nhật số lượng',
    type: [ProductUpdateDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductUpdateDto)
  products: ProductUpdateDto[];
}
