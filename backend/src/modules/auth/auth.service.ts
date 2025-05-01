import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/typeorm/entities/User';
import { Repository } from 'typeorm';
import { Account } from 'src/typeorm/entities/Account';
import { LoginDto } from './dtos/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Shop } from 'src/typeorm/entities/Shop';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Account) private accountRepository: Repository<Account>,
    @InjectRepository(Shop) private shopRepository: Repository<Shop>,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto, role: number = 1) {
    //kiểm tra xem idUser đã tồn tại hay chưa
    const findUserByEmail = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    const findUserByPhone = await this.userRepository.findOne({
      where: { phoneNumber: createUserDto.phoneNumber },
    });
    //kiểm tra
    if (findUserByEmail || findUserByPhone) {
      throw new HttpException('Email hoặc số điện thoại đã tồn tại', 400);
    } else {
      //tạo ra một đối tượng user
      const newUser = {
        ...createUserDto,
      };
      //khởi tạo newInstance
      const newUserInstance = await this.userRepository.save(newUser);

      const newAccount = this.accountRepository.create({
        idUser: newUserInstance.idUser,
        email: createUserDto.email,
        phoneNumber: createUserDto.phoneNumber,
        password: createUserDto.password,
        refreshToken: '',
        role: createUserDto.role || role,
      });

      await this.accountRepository.save(newAccount);

      // Nếu role là 2 (shop), tạo shop mới liên kết với user này
      if (role === 2 || createUserDto.role === 2) {
        const newShop = this.shopRepository.create({
          id: newUserInstance.idUser, // Giả định id shop = idUser để đơn giản
          name: createUserDto.name || `Cửa hàng của ${createUserDto.name}`,
          avatar: createUserDto.avarta || null,
          deliveryInfo: 'Delivery in 30 minutes', // Giá trị mặc định
        });

        await this.shopRepository.save(newShop);
      }

      return newAccount;
    }
  }

  async login(loginDto: LoginDto) {
    const findUserByEmail = await this.accountRepository.findOne({
      where: [
        { email: loginDto.identifier }, // tìm kiếm teo cột email
        { phoneNumber: loginDto.identifier }, // tìm kiếm thao cột số đt
      ],
    });
    if (!findUserByEmail) {
      throw new HttpException(
        'Tài khoản chưa được đăng ký',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      findUserByEmail.password,
    );
    if (!isPasswordValid) {
      throw new HttpException(
        'Mật khẩu không chính xác!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const payload = {
      idAccount: findUserByEmail.idAccount,
      idUser: findUserByEmail.idUser,
      email: findUserByEmail.email,
      phoneNumber: findUserByEmail.phoneNumber,
      role: findUserByEmail.role,
    };

    // Nếu là shop (role = 2), thêm thông tin shop vào payload
    if (findUserByEmail.role === 2) {
      const shop = await this.shopRepository.findOne({
        where: { id: findUserByEmail.idUser },
      });

      if (shop) {
        Object.assign(payload, { shopId: shop.id });
      }
    }

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: 'THISISMYKEY',
        expiresIn: '1d',
      }),
    ]);

    findUserByEmail.refreshToken = refresh_token;
    await this.accountRepository.save(findUserByEmail);

    const { password, ...userData } = findUserByEmail;

    // Nếu là shop, trả về thêm thông tin shop
    if (findUserByEmail.role === 2) {
      const shop = await this.shopRepository.findOne({
        where: { id: findUserByEmail.idUser },
      });

      if (shop) {
        return { ...userData, shop, access_token };
      }
    }

    return { ...userData, access_token };
  }
}
