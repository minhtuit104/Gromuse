import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from '../typeorm/entities/Cart';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartRepository: Repository<CartItem>,
    private productsService: ProductsService,
  ) {}

  async addToCart(productId: number | string, quantity: number): Promise<CartItem> {
    const numericId = typeof productId === 'string' ? parseInt(productId, 10) : productId;
    try {
      // Kiểm tra sản phẩm có tồn tại không
      const product = await this.productsService.findOne(numericId);
      if (!product) {
        throw new Error('Product not found');
      }

      // Tạo hoặc cập nhật bản ghi trong cart
      let cartItem = await this.cartRepository.findOne({ where: { productId: numericId } });
      
      if (cartItem) {
        // Nếu sản phẩm đã có trong cart, tăng quantity
        cartItem.quantity += quantity;
      } else {
        // Nếu chưa có, tạo mới
        cartItem = this.cartRepository.create({
          productId: numericId,
          quantity,
          product
        });
      }

      return await this.cartRepository.save(cartItem);
    } catch (error) {
      throw new Error(`Failed to add to cart: ${error.message}`);
    }
  }
}