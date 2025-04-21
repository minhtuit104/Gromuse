import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  DefaultValuePipe,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dtos/create-rating.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
// Giả sử bạn có JwtAuthGuard, hãy import nó
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';

@ApiTags('Ratings') // Đặt tên tag cho Swagger
@Controller('api') // Đặt base path là /api
export class RatingsController {
  private readonly logger = new Logger(RatingsController.name);

  constructor(private readonly ratingsService: RatingsService) {}

  @Post('ratings') // Endpoint sẽ là /api/ratings
  @UseGuards(JwtAuthGuard) // Bảo vệ endpoint này, yêu cầu token hợp lệ
  @ApiBearerAuth() // Cho Swagger biết endpoint này cần Bearer token
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Gửi đánh giá mới cho một sản phẩm đã mua' })
  @ApiResponse({ status: 201, description: 'Đánh giá đã được tạo thành công.' })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc lỗi validation.',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa xác thực (thiếu hoặc sai token).',
  })
  @ApiResponse({ status: 404, description: 'Mục đơn hàng không tồn tại.' })
  @ApiResponse({
    status: 409,
    description: 'Mục đơn hàng đã được đánh giá trước đó.',
  })
  async create(@Body() createRatingDto: CreateRatingDto, @Req() req) {
    // Lấy userId từ payload của token đã được guard xử lý và gắn vào req.user
    // Tên trường 'idUser' cần khớp với tên trong payload JWT của bạn
    const userId = req.user?.idUser;

    if (!userId || typeof userId !== 'number') {
      this.logger.warn(
        '[create] User ID not found or invalid in token payload.',
      );
      throw new UnauthorizedException(
        'Không thể xác định người dùng từ token.',
      );
    }

    this.logger.log(`[POST /api/ratings] User ${userId} submitting rating.`);
    return this.ratingsService.create(createRatingDto, userId);
  }

  @Get('products/:productId/ratings') // Endpoint sẽ là /api/products/:productId/ratings
  @ApiOperation({ summary: 'Lấy danh sách đánh giá cho một sản phẩm' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách đánh giá và thông tin tổng hợp.',
  })
  async getProductRatings(
    @Param('productId', ParseIntPipe) productId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    this.logger.log(
      `[GET /api/products/:productId/ratings] Request for productId: ${productId}, page: ${page}, limit: ${limit}`,
    );
    // Service đã trả về object chứa data, total, average, count
    return this.ratingsService.findByProduct(productId, page, limit);
  }
}
