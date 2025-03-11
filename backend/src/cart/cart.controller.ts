import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('api/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
async addToCart(@Body() body: { productId: string; quantity: number }) {
  console.log("Received cart add request with body:", body);
  try {
    const { productId, quantity } = body;
    if (!productId || !quantity) {
      throw new HttpException('Missing productId or quantity', HttpStatus.BAD_REQUEST);
    }

    const cartItem = await this.cartService.addToCart(productId, quantity);
    return cartItem;
  } catch (error) {
    console.error("Error in addToCart:", error);
    throw new HttpException(
      error.message || 'Failed to add to cart',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
}