import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty()
  senderId: number;

  @ApiProperty()
  receiverId: number;

  @ApiProperty()
  content: string;
}
