import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({
    description: 'ID của người nhận tin nhắn',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  receiverId: number;

  @ApiProperty({
    description: 'Nội dung tin nhắn',
    example: 'Xin chào!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
