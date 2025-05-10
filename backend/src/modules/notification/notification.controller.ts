import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Response,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from '../users/user.service';
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';

@ApiBearerAuth()
@ApiTags('Notifications')
@Controller('/api/v1/notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    // private readonly userService: UserService
  ) {}

  //lấy tất cả thông báo của một người dùng
  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Param('id') id: number,
    @Response() res,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('pageSize', ParseIntPipe) pageSize: number = 10,
  ) {
    const notifications = await this.notificationService.findAll(
      id,
      page,
      pageSize,
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
