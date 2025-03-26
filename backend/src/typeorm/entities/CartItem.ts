// src/typeorm/entities/Cart.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from './Product';
import { Shop } from './Shop';
// import { Cart } from './Cart';

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  productId: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Product, (product) => product.cartItems, { eager: true })
  product: Product;

  @ManyToOne('Cart', (cart: any) => cart.cartItems)
  cart: any;

  @ManyToOne(() => Shop, (shop) => shop.cartItems)
  shop: Shop;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  deletedAt: Date;
}
