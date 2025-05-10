import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from '../../typeorm/entities/User';
import { Notification } from '../../typeorm/entities/Notification';
import { NotificationRecipientType } from '../../typeorm/entities/Notification';
import { PaginatedResponse } from '../pagination/pagination.interface';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  //lấy tất cả thông báo của một người dùng
  async findAll(
    id: number,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResponse<Notification>> {
    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where: {
          recipientId: id,
          recipientType: NotificationRecipientType.USER,
        },
        relations: ['sender', 'post', 'comment'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    return {
      data: notifications,
      pagination: {
        total,
        last_page: Math.ceil(total / pageSize),
        pageSize,
        page,
      },
    };
  }

  //đánh dấu thông báo đã đọc
  async markNotificationAsRead(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new Error('Notification not found');
    }
    notification.isRead = true;
    return await this.notificationRepository.save(notification);
  }

  //xóa thông báo
  async deleteNotification(id: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });
    if (!notification) {
      throw new Error('Notification not found');
    }
    await this.notificationRepository.delete(id);
  }
}
