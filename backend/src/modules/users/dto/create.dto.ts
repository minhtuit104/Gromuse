import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'tên không được để trống' })
  name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'email không được để trống' })
  @IsEmail({}, { message: 'email không đúng định dạng' })
  email: string;

  @ApiProperty()
  birthday: string;

  @ApiProperty()
  avarta: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'password không được để trống' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'số điện thoại không được để trống' })
  phoneNumber: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  sex: string;

  @ApiProperty({
    description: 'User role (1: Normal User, 2: Shop/Admin)',
    default: 1,
  })
  role?: number;
}