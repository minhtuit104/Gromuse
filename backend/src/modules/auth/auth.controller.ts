import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Response,
} from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async create(@Body() createUserDto: CreateUserDto, @Response() res) {
    console.log('Received createUserDto in /register:', createUserDto);
    try {
      const role =
        createUserDto.role && [1, 2].includes(createUserDto.role)
          ? createUserDto.role
          : 1;
      console.log('Determined role:', role);
      const newAccount = await this.authService.register(createUserDto, role);

      // Loại bỏ password và refreshToken khỏi response
      const { password, refreshToken, ...accountData } = newAccount;

      return res.status(201).json({
        status: 201,
        message: 'Register success!',
        data: accountData, // Trả về đầy đủ thông tin tài khoản bao gồm role
      });
    } catch (error) {
      console.error('Error during registration:', error);
      const errorMessage =
        error instanceof HttpException
          ? error.getResponse()
          : error.message || 'Registration failed';
      const errorStatus =
        error instanceof HttpException ? error.getStatus() : 400;

      return res.status(errorStatus).json({
        status: errorStatus,
        message: errorMessage,
      });
      // throw new HttpException('Login failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('/login')
  async login(@Body() loginDto: LoginDto, @Response() res) {
    try {
      const data = await this.authService.login(loginDto);

      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: 'Login success!',
        data,
      });
    } catch (error) {
      const errorMessage =
        error instanceof HttpException
          ? error.getResponse()
          : error.message || 'Login failed';
      const errorStatus =
        error instanceof HttpException ? error.getStatus() : 400;

      return res.status(errorStatus).json({
        status: errorStatus,
        message: errorMessage,
      });
    }
  }
}
