
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  @IsString()
  productId: number;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}
