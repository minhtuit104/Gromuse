import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';
import { CreateMessageDto } from './dto/createdMessage.dto';
import { MessagerService } from './messager.service';

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

  // Lấy danh sách các cuộc trò chuyện của người dùng
  @Get('/conversations')
  @UseGuards(JwtAuthGuard)
  async getUserConversations(@Req() req) {
    const user = req.user;
    return this.messagerService.getUserConversations(user.idUser);
  }
}
