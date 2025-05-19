import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../typeorm/entities/Category';
import { Product } from '../../typeorm/entities/Product';
import { Shop } from '../../typeorm/entities/Shop';
import { JwtAuthGuard } from '../auth/jwtAuthGuard/jwtAuthGuard';
import { CartService } from '../cart/cart.service';
import {
  categoryDisplayNames,
  categoryImageUrls,
  displayNameToKey,
  formatCategoryName,
  ProductsService,
  tagMap,
} from './products.service';

@ApiTags('Products')
@Controller('api/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cartService: CartService,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Shop)
    private readonly shopRepository: Repository<Shop>,
  ) {}

  @Get('shop')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Thêm decorator này để Swagger biết cần gửi Bearer token
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Lọc sản phẩm theo danh mục (không bắt buộc)',
  })
  async findAllShop(
    @Req() req,
    @Query('category') category?: string,
  ): Promise<Product[]> {
    const user = req.user;
    return this.productsService.findByCategoryForShop(user.idUser, category);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth() // Thêm decorator này để Swagger biết cần gửi Bearer token
  async findAll(@Query('category') category?: string): Promise<Product[]> {
    if (category) {
      return this.productsService.findByCategory(category);
    }
    return this.productsService.findAll();
  }

  @Get('categories')
  async getAllCategories() {
    const categories = await this.categoriesRepository.find();

    return categories.map((category) => {
      const displayName =
        categoryDisplayNames[category.name] ||
        formatCategoryName(category.name);

      return {
        key: category.name,
        displayName,
        tag: tagMap[category.name] || '🏷️ Default Tag',
        imageUrl: category.imageUrl || categoryImageUrls[category.name] || null,
      };
    });
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tìm kiếm sản phẩm theo tên' })
  @ApiBearerAuth() // Thêm decorator này để Swagger biết cần gửi Bearer token
  @ApiQuery({ name: 'name', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Tìm kiếm thành công' })
  @ApiResponse({ status: 400, description: 'Từ khóa tìm kiếm không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  async searchProducts(@Query('name') searchTerm: string): Promise<any> {
    console.log('searchTerm:', searchTerm);
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        throw new HttpException(
          'Vui lòng nhập từ khóa tìm kiếm',
          HttpStatus.BAD_REQUEST,
        );
      }
      const products = await this.productsService.searchProductsByName(
        searchTerm.trim(),
      );

      return {
        message: 'success',
        data: products,
      };
    } catch (error) {
      // Log chi tiết lỗi để debug
      console.error('Error details:', error);

      throw new HttpException(
        error.message || 'Không thể tìm kiếm sản phẩm',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() productData: Partial<Product>,
    @Req() req,
  ): Promise<any> {
    try {
      const user = req.user;

      // Kiểm tra quyền truy cập (role = 2 là shop owner)
      if (!user || user.role !== 2) {
        throw new HttpException(
          'Bạn không có quyền tạo sản phẩm',
          HttpStatus.FORBIDDEN,
        );
      }

      // Tìm shop của user
      const shop = await this.shopRepository.findOneBy({ id: user.idUser });
      if (!shop) {
        throw new HttpException(
          'Không tìm thấy thông tin cửa hàng',
          HttpStatus.NOT_FOUND,
        );
      }

      const requiredFields = ['name', 'price', 'weight'];
      const missingFields = requiredFields.filter(
        (field) => !productData[field],
      );

      if (missingFields.length > 0) {
        throw new HttpException(
          `Missing required fields: ${missingFields.join(', ')}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const normalizedData = {
        ...productData,
        price: parseFloat(productData.price as any),
        weight: parseInt(productData.weight as any, 10),
        discount: productData.discount
          ? parseInt(productData.discount as any, 10)
          : null,
        startDate: productData.startDate
          ? new Date(productData.startDate)
          : null,
        endDate: productData.endDate ? new Date(productData.endDate) : null,
        active: productData.active !== undefined ? productData.active : true,
        shop: shop, // Truyền toàn bộ đối tượng shop
      };

      if (typeof productData.category === 'string') {
        // Kiểm tra xem category có phải là tên hiển thị không
        if (displayNameToKey[productData.category]) {
          normalizedData.category =
            await this.productsService.findOrCreateCategory(
              displayNameToKey[productData.category],
            );
        } else {
          normalizedData.category =
            await this.productsService.findOrCreateCategory(
              productData.category,
            );
        }
      }

      const product = await this.productsService.create(normalizedData);
      console.log('Product created successfully:', product);

      // Trả về định dạng phản hồi mới
      return {
        message: 'success',
        data: product,
      };
    } catch (error) {
      console.error('Error in create product:', error);
      throw new HttpException(
        error.message || 'Failed to create product and add to cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() productData: Partial<Product>,
    @Req() req,
  ): Promise<any> {
    try {
      const user = req.user;
      console.log(user);

      // Kiểm tra quyền truy cập (role = 2 là shop owner)
      if (!user || user.role !== 2) {
        throw new HttpException(
          'Bạn không có quyền cập nhật sản phẩm',
          HttpStatus.FORBIDDEN,
        );
      }

      const existingProduct = await this.productsService.findOne(id);
      if (!existingProduct) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      // Kiểm tra xem sản phẩm có thuộc về shop của người dùng đang đăng nhập không
      if (existingProduct.shop?.id !== user.idUser) {
        throw new HttpException(
          'Bạn không có quyền cập nhật sản phẩm này',
          HttpStatus.FORBIDDEN,
        );
      }

      let category = existingProduct.category;
      if (productData.category) {
        if (typeof productData.category === 'string') {
          // Kiểm tra xem category có phải là tên hiển thị không
          if (displayNameToKey[productData.category]) {
            category = await this.productsService.findOrCreateCategory(
              displayNameToKey[productData.category],
            );
          } else {
            category = await this.productsService.findOrCreateCategory(
              productData.category,
            );
          }
        } else {
          category = productData.category;
        }
      }

      const normalizedData = {
        ...productData,
        price: productData.price
          ? parseFloat(productData.price as any)
          : existingProduct.price,
        weight: productData.weight
          ? parseInt(productData.weight as any, 10)
          : existingProduct.weight,
        discount:
          productData.discount !== undefined
            ? parseInt(productData.discount as any, 10)
            : existingProduct.discount || 0,
        startDate: productData.startDate
          ? new Date(productData.startDate)
          : existingProduct.startDate,
        endDate: productData.endDate
          ? new Date(productData.endDate)
          : existingProduct.endDate,
        active:
          productData.active !== undefined
            ? productData.active
            : existingProduct.active,
        category: category,
        tag: tagMap[category.name] || existingProduct.tag,
      };

      const updatedProduct = await this.productsService.update(
        id,
        normalizedData,
      );

      // Trả về định dạng phản hồi giống như create
      return {
        message: 'success',
        data: updatedProduct,
      };
    } catch (error) {
      console.error('Error in update product:', error);
      throw new HttpException(
        error.message || 'Failed to update product',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('most-sold/:limit')
  async getMostSold(@Param('limit') limit: number = 10): Promise<Product[]> {
    try {
      return await this.productsService.findMostSold(limit);
    } catch (error) {
      console.error('Error getting most sold products:', error);
      throw new HttpException(
        error.message || 'Failed to get most sold products',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('categories/update-images') // Make sure you call this endpoint (e.g., using Postman or curl)
  async updateCategoryImages() {
    try {
      const categories = await this.categoriesRepository.find();
      let updatedCount = 0;

      for (const category of categories) {
        // Use the correct map from the service
        const correctImageUrl = categoryImageUrls[category.name];
        // Check if the correct URL exists AND if the current DB URL is missing or different
        if (correctImageUrl && category.imageUrl !== correctImageUrl) {
          console.log(
            `Updating category ${category.name}: '${category.imageUrl}' -> '${correctImageUrl}'`,
          ); // Add logging
          category.imageUrl = correctImageUrl; // Assign the CORRECT path
          await this.categoriesRepository.save(category);
          updatedCount++;
        } else if (correctImageUrl && !category.imageUrl) {
          console.log(
            `Updating category ${category.name}: null -> '${correctImageUrl}'`,
          ); // Add logging for initial set
          category.imageUrl = correctImageUrl;
          await this.categoriesRepository.save(category);
          updatedCount++;
        }
      }

      console.log(
        `Category image update finished. Updated ${updatedCount} categories.`,
      ); // Add logging
      return {
        success: true,
        message: `Updated images for ${updatedCount} categories`,
        updatedCount,
      };
    } catch (error) {
      console.error('Error updating category images:', error);
      throw new HttpException(
        'Failed to update category images',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
