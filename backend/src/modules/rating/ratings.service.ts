import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationContentType } from 'src/typeorm/entities/Notification';
import { Repository } from 'typeorm';
import { CartItem, OrderStatus } from '../../typeorm/entities/CartItem';
import { Product } from '../../typeorm/entities/Product';
import { Rating } from '../../typeorm/entities/Rating';
import { User } from '../../typeorm/entities/User';
import { NotificationService } from '../notification/notification.service';
import { UserService } from '../users/user.service';
import { CreateRatingDto } from './dtos/create-rating.dto';

@Injectable()
export class RatingsService {
  private readonly logger = new Logger(RatingsService.name);

  constructor(
    @InjectRepository(Rating)
    private ratingRepository: Repository<Rating>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly notificationService: NotificationService,
    private readonly userService: UserService,
  ) {}

  private async updateProductRatingStats(productId: number): Promise<void> {
    this.logger.log(
      `[updateProductRatingStats] Updating average rating for productId: ${productId}`,
    );
    const stats = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.rating)', 'average')
      .where('rating.productId = :productId', { productId })
      .getRawOne();

    const averageRating = stats?.average ? parseFloat(stats.average) : 0;

    this.logger.log(
      `[updateProductRatingStats] Calculated average for productId ${productId}: ${averageRating.toFixed(1)}`,
    );

    await this.productRepository.update(productId, {
      averageRating: parseFloat(averageRating.toFixed(1)),
    });

    this.logger.log(
      `[updateProductRatingStats] Successfully updated product ${productId} average rating.`,
    );
  }

  async create(
    createRatingDto: CreateRatingDto,
    userId: number,
  ): Promise<Rating> {
    const { productId, cartItemId, rating, comment, images } = createRatingDto;

    this.logger.log(
      `[create] User ${userId} attempting to rate cartItemId: ${cartItemId} for productId: ${productId}`,
    );

    // 1. Kiểm tra CartItem tồn tại, trạng thái và quyền sở hữu
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['product', 'cart', 'cart.user', 'shop'],
    });

    if (!cartItem) {
      this.logger.warn(`[create] CartItem with ID ${cartItemId} not found.`);
      throw new NotFoundException(
        `Mục đơn hàng với ID ${cartItemId} không tồn tại.`,
      );
    }

    if (cartItem.status !== OrderStatus.COMPLETE) {
      this.logger.warn(
        `[create] CartItem ${cartItemId} is not completed. Status: ${cartItem.status}`,
      );
      throw new BadRequestException(
        `Chỉ có thể đánh giá mục đơn hàng đã hoàn thành. Trạng thái hiện tại: ${cartItem.status}`,
      );
    }

    // Kiểm tra cart có tồn tại và có idUser không
    if (!cartItem.cart || typeof cartItem.cart.idUser !== 'number') {
      this.logger.error(
        `[create] Cart or cart.idUser missing for CartItem ${cartItemId}.`,
      );
      throw new InternalServerErrorException(
        'Lỗi dữ liệu đơn hàng, không thể xác định người mua.',
      );
    }

    if (cartItem.cart.idUser !== userId) {
      this.logger.warn(
        `[create] User ${userId} does not own CartItem ${cartItemId} (Owner: ${cartItem.cart.idUser})`,
      );
      throw new BadRequestException(
        'Bạn không có quyền đánh giá mục đơn hàng này.',
      );
    }

    if (cartItem.productId !== productId) {
      this.logger.warn(
        `[create] Product ID mismatch for CartItem ${cartItemId}. Expected ${cartItem.productId}, got ${productId}`,
      );
      throw new BadRequestException(`ID sản phẩm không khớp với mục đơn hàng.`);
    }

    // 2. Kiểm tra xem CartItem đã được đánh giá chưa (dùng unique constraint hoặc query)
    // Cách 1: Dùng query (an toàn hơn nếu unique constraint chưa được tạo đúng)
    const existingRating = await this.ratingRepository.findOne({
      where: { cartItemId: cartItemId },
    });
    if (existingRating) {
      this.logger.warn(
        `[create] CartItem ${cartItemId} has already been rated (Rating ID: ${existingRating.id}).`,
      );
      throw new ConflictException(`Bạn đã đánh giá mục đơn hàng này rồi.`);
    }

    // 3. Tạo và lưu Rating mới
    const newRating = this.ratingRepository.create({
      userId,
      productId,
      cartItemId,
      rating,
      comment,
      images,
    });

    try {
      const savedRating = await this.ratingRepository.save(newRating);
      this.logger.log(
        `[create] Successfully saved Rating ID: ${savedRating.id} for CartItem ID: ${cartItemId}`,
      );

      try {
        await this.updateProductRatingStats(productId);
      } catch (updateError) {
        this.logger.error(
          `[create] Failed to update product rating stats for productId ${productId} after saving rating ${savedRating.id}. Error: ${updateError.message}`,
          updateError.stack,
        );
      }
      const user = await this.userService.findUserById(userId);
      const notificationType = NotificationContentType.PRODUCT_RATED;
      const notificationMessage = ``;
      const notificationMessageForShop = `${user.name} đã đánh giá sản phẩm của bạn.`;
      // console.log("chạy vào đây r")
      await this.notificationService.createOrderNotification(
        cartItem,
        notificationType,
        notificationMessage,
        notificationMessageForShop,
      );
      return savedRating;
    } catch (error) {
      this.logger.error(
        `[create] Error saving rating for CartItem ${cartItemId}: ${error.message}`,
        error.stack,
      );
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        throw new ConflictException(
          `Bạn đã đánh giá mục đơn hàng này rồi (DB constraint).`,
        );
      }
      throw new InternalServerErrorException('Không thể lưu đánh giá.');
    }
  }

  async findByProduct(
    productId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: Rating[];
    total: number;
    average: number;
    count: number;
  }> {
    this.logger.log(
      `[findByProduct] Fetching ratings for productId: ${productId}, page: ${page}, limit: ${limit}`,
    );
    const skip = (page - 1) * limit;

    // --- Query để lấy dữ liệu (sử dụng getMany) ---
    const dataQueryBuilder = this.ratingRepository
      .createQueryBuilder('rating')
      .leftJoinAndSelect('rating.user', 'user') // Join và chọn user
      .where('rating.productId = :productId', { productId }) // Lọc theo productId
      .select([
        // Chọn các trường cần thiết
        'rating.id',
        'rating.userId',
        'rating.productId',
        'rating.cartItemId',
        'rating.rating',
        'rating.comment',
        'rating.images',
        'rating.createdAt',
        'rating.updatedAt',
        'user.idUser', // Chọn các trường user cần thiết
        'user.name',
        'user.avarta', // Đảm bảo trường này tồn tại trong User entity
      ])
      .orderBy('rating.createdAt', 'DESC') // Sắp xếp
      .skip(skip) // Phân trang
      .take(limit); // Phân trang

    const data = await dataQueryBuilder.getMany(); // Lấy danh sách dữ liệu

    // --- Query để đếm tổng số lượng (sử dụng getCount) ---
    const countQueryBuilder = this.ratingRepository
      .createQueryBuilder('rating')
      .where('rating.productId = :productId', { productId }); // Chỉ cần điều kiện where

    const total = await countQueryBuilder.getCount(); // Lấy tổng số lượng

    const productStats = await this.productRepository
      .createQueryBuilder('product')
      .select('product.averageRating', 'averageRating')
      .where('product.id = :productId', { productId })
      .getRawOne();

    const average = productStats?.averageRating || 0;
    const count = total; // Sử dụng total từ getCount

    this.logger.log(
      `[findByProduct] Found ${total} ratings for productId: ${productId}. Average from Product table: ${average}`,
    );

    return { data, total: count, average: average, count: count };
  }
}
