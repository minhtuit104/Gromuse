import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Response,
  Req,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { MessagerService } from './messager.service';
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateMessageDto } from './dto/createdMessage.dto';

@ApiBearerAuth()
@ApiTags('Messagers')
@Controller('/api/v1/messagers')
export class MessagerController {
  constructor(private readonly messagerService: MessagerService) {}

  // Lấy tất cả các tin nhắn giữa hai người dùng
  @Get(':userId1/:userId2')
  @UseGuards(JwtAuthGuard)
  async getMessagesBetweenUsers(
    @Param('userId2') userId2: number,
    @Response() res,
    @Req() req: Request,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 10,
  ) {
    const user = req['user'];
    const userId1 = user.idUser;

    try {
      const result = await this.messagerService.getMessagesBetweenUsers(
        userId1,
        userId2,
        page,
        pageSize,
      );
      return res.status(200).json({
        code: 200,
        success: true,
        message: 'SUCCESS',
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        code: 500,
        success: false,
        message: 'FAILED',
        error: error.message,
      });
    }
  }

  //tạo mới một tin nhắn từ API HTTP (không dùng websocket)
  @Post()
  // @UseGuards(JwtAuthGuard)
  async createMessage(@Body() createMessageDto: CreateMessageDto) {
    return this.messagerService.createMessage(
      createMessageDto.senderId,
      createMessageDto.receiverId,
      createMessageDto.content,
    );
  }

  // Lấy danh sách các cuộc trò chuyện của người dùng
  @Get('/user/:userId/conversations')
  // @UseGuards(JwtAuthGuard)
  async getUserConversations(@Param('userId') userId: number) {
    return this.messagerService.getUserConversations(userId);
  }
}
