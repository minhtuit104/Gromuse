import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';
import { DashboardService } from './dashboard.service';
import { GetLatestOrdersQueryDto } from './dtos/dashboard.dto';

@ApiTags('Dashboard')
@Controller('api/v1/dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('latest-orders')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng mới nhất của cửa hàng' })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách đơn hàng mới nhất của cửa hàng',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Lấy danh sách đơn hàng thành công',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              quantity: { type: 'number', example: 2 },
              status: { type: 'string', example: 'TO_RECEIVE' },
              isPaid: { type: 'boolean', example: true },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2023-01-01T00:00:00Z',
              },
              product: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'Sản phẩm' },
                  price: { type: 'number', example: 100000 },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Người dùng không có quyền truy cập',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thông tin cửa hàng',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getLatestOrders(@Query() query: GetLatestOrdersQueryDto, @Req() req) {
    try {
      // Lấy thông tin user từ request
      const user = req.user;

      // Kiểm tra quyền truy cập (nếu role = 2 là shop owner)
      console.log({ user });
      if (!user || user.role !== 2) {
        throw new HttpException(
          'Bạn không có quyền truy cập thông tin này',
          HttpStatus.FORBIDDEN,
        );
      }

      return await this.dashboardService.getLatestCartItemsByShopOwner(
        user.idUser,
        query.limit,
      );
    } catch (error) {
      this.logger.error(`Lỗi khi lấy đơn hàng mới nhất: ${error.message}`);
      throw new HttpException(
        error.message || 'Lỗi khi lấy đơn hàng mới nhất',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
