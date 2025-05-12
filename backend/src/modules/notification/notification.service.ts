import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../../typeorm/entities/CartItem';
import {
  Notification,
  NotificationContentType,
  NotificationRecipientType,
} from '../../typeorm/entities/Notification';
import { User } from '../../typeorm/entities/User';
import { MyGateway } from '../gateway/message.gateway';
import { PaginatedResponse } from '../pagination/pagination.interface';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly gateway: MyGateway,
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

  // Tạo thông báo cho đơn hàng
  async createOrderNotification(
    cartItem: CartItem,
    type: NotificationContentType,
    message: string,
  ): Promise<Notification> {
    // Tạo thông báo cho user
    const userNotification = this.notificationRepository.create({
      recipientId: cartItem.cart.idUser,
      recipientType: NotificationRecipientType.USER,
      type: type,
      message: message,
      title: 'Cập nhật đơn hàng',
      redirectUrl: `/order/${cartItem.id}`,
      relatedCartItemId: cartItem.id,
      relatedShopId: cartItem.shop?.id,
      relatedProductId: cartItem.product?.id,
    });

    const savedNotification =
      await this.notificationRepository.save(userNotification);

    // Gửi thông báo qua WebSocket
    const userSocket = this.gateway.getSocketByUserId(cartItem.cart.idUser);
    if (userSocket) {
      this.gateway.server.to(userSocket.id).emit('orderNotification', {
        type: type,
        message: message,
        cartItemId: cartItem.id,
        notification: savedNotification,
      });
    }

    return savedNotification;
  }
}
