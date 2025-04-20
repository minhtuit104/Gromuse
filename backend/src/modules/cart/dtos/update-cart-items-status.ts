import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  ArrayNotEmpty,
} from 'class-validator';

export class UpdateCartItemsStatusDto {
  @ApiProperty({ example: true, description: 'Trạng thái thanh toán mới' })
  @IsBoolean()
  isPaid: boolean;

  @ApiProperty({
    example: [15, 16],
    description: 'Mảng các ID của CartItem cần cập nhật trạng thái',
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  cartItemIds: number[];
}
