import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsOptional,
  Min,
  Max,
  IsArray,
  IsUrl,
  ArrayMaxSize,
} from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ example: 1, description: 'ID của sản phẩm được đánh giá' })
  @IsInt()
  productId: number;

  @ApiProperty({
    example: 15,
    description: 'ID của mục giỏ hàng (CartItem) đã hoàn thành',
  })
  @IsInt()
  cartItemId: number;

  @ApiProperty({ example: 5, description: 'Điểm đánh giá (từ 1 đến 5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({
    example: 'Sản phẩm rất tốt!',
    required: false,
    description: 'Nội dung bình luận (tùy chọn)',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    example: ['../../assets/images/imagePNG/lays_1 1.png'],
    required: false,
    description: 'Mảng các URL hình ảnh đính kèm (tối đa 5)',
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @ArrayMaxSize(5)
  images?: string[];
}
