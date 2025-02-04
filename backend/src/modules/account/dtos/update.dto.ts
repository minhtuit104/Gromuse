import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class UpdateAccountDto {
    @ApiProperty()
    @IsNotEmpty({message: 'email không được để trống'})
    @IsEmail({}, {message: 'email không đúng định dạng'})
    email: string;

    @ApiProperty()
    @IsNotEmpty({message: 'password không được để trống'})
    password: string;

    @ApiProperty()
    refreshToken: string;
    
    @ApiProperty()
    role: number;
}