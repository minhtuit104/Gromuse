import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DetailService } from './detail.service';
import { CreateDetailDto } from './dtos/create-detail.dto';
import { UpdateDetailDto } from './dtos/update-detail.dto';

@Controller('api/detail')
export class DetailController {
  constructor(private readonly detailService: DetailService) {}

  @Get(':id')
  async getDetail(@Param('id') id: string) {
    try {
      // Validate id
      const detailId = parseInt(id);
      if (isNaN(detailId)) {
        throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
      }

      const detail = await this.detailService.findOne(detailId);
      if (!detail) {
        throw new NotFoundException(`Detail with ID ${id} not found`);
      }

      const shop = await this.detailService.getShopForDetail(detailId);
      if (!shop) {
        throw new NotFoundException(`Shop for detail ID ${id} not found`);
      }

      return {
        success: true,
        data: {
          detail,
          shop,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error fetching detail',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async createDetail(@Body() createDetailDto: CreateDetailDto) {
    try {
      const newDetail = await this.detailService.create(createDetailDto);
      return {
        success: true,
        data: newDetail,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Error creating detail',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put(':id')
  async updateDetail(
    @Param('id') id: string,
    @Body() updateDetailDto: UpdateDetailDto,
  ) {
    try {
      const detailId = parseInt(id);
      if (isNaN(detailId)) {
        throw new HttpException('Invalid ID format', HttpStatus.BAD_REQUEST);
      }

      const updatedDetail = await this.detailService.update(
        detailId,
        updateDetailDto,
      );
      if (!updatedDetail) {
        throw new NotFoundException(`Detail with ID ${id} not found`);
      }

      return {
        success: true,
        data: updatedDetail,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Error updating detail',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
