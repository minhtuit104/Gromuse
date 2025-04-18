import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class PaidProductIdentifierDto {
  @ApiProperty({ description: 'ID của sản phẩm đã được thanh toán' })
  @IsNumber()
  id: number;
}

export class UpdateCartItemsStatusDto {
  @ApiProperty({ description: 'Trạng thái thanh toán mới của các CartItem' })
  @IsBoolean()
  isPaid: boolean;

  @ApiProperty({
    description: 'Danh sách ID các sản phẩm cần cập nhật trạng thái',
    type: [PaidProductIdentifierDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaidProductIdentifierDto)
  products: PaidProductIdentifierDto[];
}
