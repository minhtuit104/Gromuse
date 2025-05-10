import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Messager } from '../../typeorm/entities/Messager';
import { User } from 'src/typeorm/entities/User';
import { PaginatedResponse } from '../pagination/pagination.interface';

@Injectable()
export class MessagerService {
  constructor(
    @InjectRepository(Messager)
    private readonly messagerRepository: Repository<Messager>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    return this.messagerRepository
      .createQueryBuilder('messager')
      .leftJoinAndSelect('messager.sender', 'sender')
      .leftJoinAndSelect('messager.receiver', 'receiver')
      .where('sender.idUser = :userId', { userId })
      .orWhere('receiver.idUser = :userId', { userId })
      .getMany();
  }
}
