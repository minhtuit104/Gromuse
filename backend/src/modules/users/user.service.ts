import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create.dto';
import { UpdateUserDto } from './dto/update.dto';
import { UpdateAvatarDto } from './dto/updateAvatar.dto';
import { log } from 'console';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async findAll() {
    return await this.userRepository.find();
  }

  async findOne(id: number) {
    return await this.userRepository.findOne({ where: { idUser: id } });
  }

  async remove(id: number) {
    //tìm kiếm theo id
    const findUser = await this.findOne(id);
    if (findUser) {
      return this.userRepository.remove(findUser);
    }
  }

  async create(createUserDto: CreateUserDto) {
    const newUser = {
      ...createUserDto,
      active: new Date(),
    };
    //tạo instance từ entity nhưng không lưu vào Database
    const newInstance = this.userRepository.create(newUser);

    //Lưu từ Instance vào trong database
    return await this.userRepository.save(newInstance);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const findUser = await this.findOne(id);
    if (!findUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    try {
      this.userRepository.merge(findUser, updateUserDto);
      const updatedUser = await this.userRepository.save(findUser);
      return updatedUser;
    } catch (error) {
      throw new HttpException(
        'Failed to update user profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  //hàm cập nhật avatar
  async updateAvatar(id: number, updateAvatarDto: UpdateAvatarDto) {
    const findUser = await this.findOne(id);
    if (!findUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    try {
      findUser.avarta = updateAvatarDto.imageUrl;
      const updateUser = await this.userRepository.save(findUser);
      return updateUser;
    } catch (error) {
      throw new HttpException(
        'Failed to update avatar',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }
}
