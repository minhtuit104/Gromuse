import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class UpdateUserDto {
    
    @ApiProperty({required: false})
    name?: string;

    @ApiProperty({required: false})
    email?: string;

    @ApiProperty({required: false})
    birthday?: string;

    @ApiProperty({required: false})
    avarta?: string;

    @ApiProperty({required: false})
    phoneNumber?: string;

    @ApiProperty({required: false})
    address?: string;
    
    @ApiProperty({required: false})
    sex?: string;

}