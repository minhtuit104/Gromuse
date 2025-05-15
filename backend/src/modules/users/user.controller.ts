import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Response,
  Req,
  HttpException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create.dto';
import { UpdateUserDto } from './dto/update.dto';
import { UpdateAvatarDto } from './dto/updateAvatar.dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('api/v1/users')
export class UserController {
  //khởi tạo controctor cho userService
  constructor(private userService: UserService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Response() res) {
    const users = await this.userService.findAll();
    return res.status(200).json({
      status: 'success',
      message: 'Users retrieved successfully',
      data: users,
    });
  }

  @Get('customers') // Endpoint mới cho khách hàng
  @UseGuards(JwtAuthGuard)
  async findAllCustomers(@Response() res) {
    const users = await this.userService.findAllCustomers();
    return res.status(200).json({
      status: 'success',
      message: 'Customers retrieved successfully',
      data: users,
    });
  }

  @Get('shops') // Endpoint mới cho cửa hàng
  @UseGuards(JwtAuthGuard)
  async findAllShops(@Response() res) {
    const users = await this.userService.findAllShops();
    return res.status(200).json({
      status: 'success',
      message: 'Shops retrieved successfully',
      data: users,
    });
  }

  @Get('/:id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number, @Response() res) {
    const user = await this.userService.findOne(id);
    return res.status(200).json({
      status: 'success',
      message: 'get one user success',
      data: user,
    });
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  //cập nhật thông tin cá nhân
  @Put('/update-profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: Request,
    @Response() res,
  ) {
    try {
      console.log('updateUserDto', updateUserDto);

      const user = req['user'];
      const idUser = user.idUser;
      console.log('idUser', idUser);

      const updatedUser = await this.userService.update(idUser, updateUserDto);

      return res.status(200).json({
        status: 'success',
        message: 'update profile success',
        data: updatedUser,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        return res.status(error.getStatus()).json({
          status: 'error',
          message: error.message,
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Internal server error while updating profile',
      });
    }
  }

  @Put('/update-avatar')
  async updateAvatar(
    @Body() updateAvatarDto: UpdateAvatarDto,
    @Req() req: Request,
    @Response() res,
  ) {
    try {
      const user = req['user'];
      const idUser = user.idUser;
      const userUpdate = await this.userService.updateAvatar(
        idUser,
        updateAvatarDto,
      );
      return res.status(200).json({
        status: 'success',
        message: 'update avatar success',
        data: userUpdate.avarta,
      });
    } catch (error) {
      // Xử lý các loại lỗi khác nhau
      if (error instanceof HttpException) {
        return res.status(error.getStatus()).json({
          status: 'error',
          message: error.message,
        });
      }

      return res.status(500).json({
        status: 'error',
        message: 'Internal server error while updating avatar',
      });
    }
  }
}
