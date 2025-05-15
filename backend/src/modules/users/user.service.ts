import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Repository } from 'typeorm';
import { Account } from 'src/typeorm/entities/Account';
import { CreateUserDto } from './dto/create.dto';
import { UpdateUserDto } from './dto/update.dto';
import { UpdateAvatarDto } from './dto/updateAvatar.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Account) private accountRepository: Repository<Account>, // Inject AccountRepository
  ) {}

  async findAll() {
    // Lấy tất cả user và join với account để lấy role
    return await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.accounts', 'account') // Giả sử quan hệ tên là 'accounts'
      .getMany();
  }

  async findAllCustomers(): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoin('user.accounts', 'account', 'account.role = :role', {
        role: 1,
      })
      .select([
        'user.idUser',
        'user.name',
        'user.avarta',
        'user.email',
        'user.phoneNumber',
      ]) // Chọn các trường cần thiết
      .getMany();
  }

  async findAllShops(): Promise<User[]> {
    console.log('[UserService.findAllShops] Fetching shops (role=2)...');
    try {
      const query = this.userRepository
        .createQueryBuilder('user')
        .innerJoin(
          'account',
          'account',
          'account.idUser = user.idUser AND account.role = :role',
          {
            role: 2,
          },
        )
        .select([
          'user.idUser',
          'user.name',
          'user.avarta',
          'user.email',
          'user.phoneNumber',
        ]);

      console.log(
        '[UserService.findAllShops] Executing query:',
        query.getSql(),
      );

      const shops = await query.getMany();
      console.log(`[UserService.findAllShops] Found ${shops.length} shops`);
      console.log(
        '[UserService.findAllShops] Shop data:',
        JSON.stringify(shops.map((s) => ({ id: s.idUser, name: s.name }))),
      );

      return shops;
    } catch (error) {
      console.error('[UserService.findAllShops] Error fetching shops:', error);
      throw new HttpException(
        'Failed to fetch shops',
        HttpStatus.INTERNAL_SERVER_ERROR,
        { cause: error },
      );
    }
  }

  async findOne(id: number) {
    return await this.userRepository.findOne({ where: { idUser: id } });
  }

  async findUserById(id: number) {
    return await this.findOne(id);
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
