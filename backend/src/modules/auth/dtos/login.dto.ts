import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: 'Email hoặc số điện thoại' })
  @IsNotEmpty({ message: 'Email hoặc số điện thoại không được để trống.' })
  identifier: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  password: string;
}