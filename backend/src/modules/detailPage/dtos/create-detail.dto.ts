import {
  IsString,
  IsNumber,
  IsArray,
  IsObject,
  IsNotEmpty,
} from 'class-validator';

export class CreateDetailDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsNotEmpty()
  discount: number;

  @IsArray()
  @IsString({ each: true })
  images: string[];

  @IsNumber()
  @IsNotEmpty()
  sold: number;

  @IsString()
  @IsNotEmpty()
  timeLeft: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsObject()
  @IsNotEmpty()
  description: {
    text: string;
    variants: string[];
    image: string;
  };
}
