import {
  Controller,
  Get,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Put,
  Param,
  Query,
} from '@nestjs/common';
import { formatCategoryName, ProductsService } from './products.service';
import { Product } from '../../typeorm/entities/Product';
import { CartService } from '../cart/cart.service';
import {
  tagMap,
  categoryDisplayNames,
  displayNameToKey,
  categoryImageUrls,
} from './products.service';
import { Repository } from 'typeorm';
import { Category } from '../../typeorm/entities/Category';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('api/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cartService: CartService,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  @Get()
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

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(@Body() productData: Partial<Product>): Promise<Product> {
    try {
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

      return product;
    } catch (error) {
      console.error('Error in create product:', error);
      throw new HttpException(
        error.message || 'Failed to create product and add to cart',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() productData: Partial<Product>,
  ): Promise<Product> {
    try {
      const existingProduct = await this.productsService.findOne(id);
      if (!existingProduct) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
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

      return await this.productsService.update(id, normalizedData);
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
