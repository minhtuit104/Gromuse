import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateCartDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}
