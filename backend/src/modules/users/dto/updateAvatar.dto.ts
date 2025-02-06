import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateAvatarDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'ImageUrl không được để trống' })
    @IsString({ message: 'ImageUrl phải là chuỗi' })
    imageUrl: string;
}