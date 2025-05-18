import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Messager } from '../../typeorm/entities/Messager';
import { PaginatedResponse } from '../pagination/pagination.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MessagerService {
  constructor(
    @InjectRepository(Messager)
    private readonly messagerRepository: Repository<Messager>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private eventEmitter: EventEmitter2,
  ) {}

  // Lấy tất cả các tin nhắn giữa hai người dùng
  async getMessagesBetweenUsers(
    userId1: number,
    userId2: number,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginatedResponse<Messager>> {
    const [messager, total] = await this.messagerRepository.findAndCount({
      where: [
        { sender: { idUser: userId1 }, receiver: { idUser: userId2 } },
        { sender: { idUser: userId2 }, receiver: { idUser: userId1 } },
      ],
      relations: ['sender', 'receiver'], // Quan hệ với bảng user
      order: { createAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    if (!messager.length) {
      throw new NotFoundException('No messages found between users');
    }
    return {
      data: messager,
      pagination: {
        total,
        last_page: Math.ceil(total / pageSize),
        pageSize,
        page,
      },
    };
  }

  // Tạo mới một tin nhắn
  async createMessage(
    senderId: number,
    receiverId: number,
    content: string,
  ): Promise<Messager> {
    const sender = await this.userRepository.findOne({
      where: { idUser: senderId },
    });
    const receiver = await this.userRepository.findOne({
      where: { idUser: receiverId },
    });

    const message = this.messagerRepository.create({
      sender,
      receiver,
      content,
    });
    return this.messagerRepository.save(message);
  }

  // Lấy danh sách các cuộc trò chuyện của người dùng
  async getUserConversations(userId: number): Promise<any[]> {
    // Tạo subquery để lấy ID tin nhắn cuối cùng của mỗi cuộc trò chuyện
    const lastMessageIds = await this.messagerRepository
      .createQueryBuilder('msg')
      .select('MAX(msg.idMessager)', 'maxId')
      .where('msg.sender.idUser = :userId OR msg.receiver.idUser = :userId', {
        userId,
      })
      .groupBy(
        'LEAST(COALESCE(msg.sender.idUser, 0), COALESCE(msg.receiver.idUser, 0))',
      )
      .addGroupBy(
        'GREATEST(COALESCE(msg.sender.idUser, 0), COALESCE(msg.receiver.idUser, 0))',
      )
      .getRawMany();

    // Lấy chi tiết tin nhắn cuối cùng và thông tin người dùng
    const conversations = await this.messagerRepository
      .createQueryBuilder('messager')
      .leftJoinAndSelect('messager.sender', 'sender')
      .leftJoinAndSelect('messager.receiver', 'receiver')
      .where('messager.idMessager IN (:...ids)', {
        ids: lastMessageIds.map((msg) => msg.maxId),
      })
      .orderBy('messager.createAt', 'DESC')
      .getMany();

    // Xử lý và trả về kết quả
    return conversations.map((conversation) => {
      const otherUser =
        conversation.sender.idUser === userId
          ? conversation.receiver
          : conversation.sender;

      return {
        idUser: otherUser.idUser,
        name: otherUser.name,
        avarta: otherUser.avarta,
        lastMessage: conversation.content,
        createAt: conversation.createAt,
        isLastMessageMine: conversation.sender.idUser === userId, // Thêm trường này để biết tin nhắn cuối là của ai
      };
    });
  }
}
