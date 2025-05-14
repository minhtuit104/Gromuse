import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  Response,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationRecipientType } from 'src/typeorm/entities/Notification';
import { AccountService } from '../account/account.service';
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';
import { NotificationService } from './notification.service';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('/api/v1/notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly accountService: AccountService, 
  ) {}

  //lấy tất cả thông báo của một người dùng
  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Param('id') id: number,
    @Response() res,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 10,
    @Req() req,
  ) {
    const user = req.user;

    if (user.idUser !== id) {
      // Hoặc trả lỗi Forbidden, hoặc xử lý theo logic của bạn
      return res.status(403).json({
        code: 403,
        success: false,
        message: 'Forbidden: You can only access your own notifications.',
      });
    }

    // Dòng này để tìm account theo yêu cầu của bạn
    const account = await this.accountService.findByUserId(user.idUser);
    const role =
      account.role === 1
        ? NotificationRecipientType.USER
        : NotificationRecipientType.SHOP;

    const notifications = await this.notificationService.findAll(
      id, // id này là recipientId của notification
      page,
      pageSize,
      role,
    );
    return res.status(200).json({
      code: 200,
      success: true,
      message: 'SUCCESS',
      data: notifications,
    });
  }

  //đánh dấu thông báo đã đọc
  @Patch('/:id/read')
  async markAsRead(@Param('id') id: number) {
    const notification =
      await this.notificationService.markNotificationAsRead(id);
    return { success: true, notification };
  }

  //xóa thông báo
  @Delete('/:id')
  async delete(@Param('id') id: number, @Response() res) {
    const notification = await this.notificationService.deleteNotification(id);
    return res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully',
      data: notification,
    });
  }
}
