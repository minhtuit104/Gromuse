import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class CreateAccountDto {

    @ApiProperty() //Được sử dụng để tạo tài liệu API tự động với Swagger.
    @IsNotEmpty({message: 'idUser không được để trống'})
    idUser: number;

    @ApiProperty()
    @IsNotEmpty({message: 'email không được để trống'})
    @IsEmail({}, {message: 'email không đúng định dạng'})
    email: string;

    @ApiProperty()
    @IsNotEmpty({message: 'số điện thoại không được để trống'})
    phoneNumber: string;

    @ApiProperty()
    @IsNotEmpty({message: 'password không được để trống'})
    password: string;

    @ApiProperty()
    refreshToken: string;
    @ApiProperty()
    role: number;
}