import { Controller, Get, Post, Body, HttpException, HttpStatus, Put, Param } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../typeorm/entities/Product';
import { CartService } from '../cart/cart.service';
import { tagMap } from './products.service';

@Controller('api/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cartService: CartService,
  ) {}

  @Get()
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Post()
  async create(@Body() productData: Partial<Product>): Promise<Product> {
    try {
      const requiredFields = ['name', 'price', 'amount', 'weight'];
      const missingFields = requiredFields.filter(field => !productData[field]);
      
      if (missingFields.length > 0) {
        throw new HttpException(
          `Missing required fields: ${missingFields.join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const normalizedData = {
        ...productData,
        price: parseFloat(productData.price as any),
        amount: parseInt(productData.amount as any, 10),
        weight: parseInt(productData.weight as any, 10),
        discount: productData.discount ? parseInt(productData.discount as any, 10) : null,
        startDate: productData.startDate ? new Date(productData.startDate) : null,
        endDate: productData.endDate ? new Date(productData.endDate) : null,
        active: productData.active !== undefined ? productData.active : true
      };

      if (typeof productData.category === 'string') {
        normalizedData.category = await this.productsService.findOrCreateCategory(productData.category);
      }

      const product = await this.productsService.create(normalizedData);
      console.log("Product created successfully:", product);

      // Tách logic thêm vào giỏ hàng thành bước riêng, không ảnh hưởng đến phản hồi chính
    try {
      await this.cartService.addToCart(product.id, 1);
      console.log("Product added to cart successfully");
    } catch (cartError) {
      console.warn("Failed to add product to cart, but product creation succeeded:", cartError.message);
      // Không ném lỗi lên frontend để tránh ảnh hưởng đến trạng thái nút
    }

      return product;
    } catch (error) {
      console.error("Error in create product:", error);
      throw new HttpException(
        error.message || 'Failed to create product and add to cart',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

@Put(':id')
async update(@Param('id') id: string, @Body() productData: Partial<Product>): Promise<Product> {
  try {
    const existingProduct = await this.productsService.findOne(id);
    if (!existingProduct) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    let category = existingProduct.category;
    if (productData.category) {
      if (typeof productData.category === 'string') {
        category = await this.productsService.findOrCreateCategory(productData.category);
      } else {
        category = productData.category;
      }
    }

    const normalizedData = {
      ...productData,
      price: productData.price ? parseFloat(productData.price as any) : existingProduct.price,
      amount: productData.amount ? parseInt(productData.amount as any, 10) : existingProduct.amount,
      weight: productData.weight ? parseInt(productData.weight as any, 10) : existingProduct.weight,
      discount: productData.discount !== undefined ? parseInt(productData.discount as any, 10) : existingProduct.discount || 0,
      startDate: productData.startDate ? new Date(productData.startDate) : existingProduct.startDate,
      endDate: productData.endDate ? new Date(productData.endDate) : existingProduct.endDate,
      active: productData.active !== undefined ? productData.active : existingProduct.active,
      category: category,
      tag: tagMap[category.name] || existingProduct.tag
    };

    return await this.productsService.update(id, normalizedData);
  } catch (error) {
    console.error("Error in update product:", error);
    throw new HttpException(
      error.message || 'Failed to update product',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
}