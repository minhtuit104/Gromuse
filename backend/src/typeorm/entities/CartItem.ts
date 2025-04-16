// src/typeorm/entities/Cart.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './Product';
import { Shop } from './Shop';
import { Payment } from './Payment';
import { Cart } from './Cart';

export enum OrderStatus {
  TO_RECEIVE = 'TO_RECEIVE',
  COMPLETE = 'COMPLETE',
  CANCEL_BYSHOP = 'CANCEL_BYSHOP',
  CANCEL_BYUSER = 'CANCEL_BYUSER',
}

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int', nullable: true })
  paymentId: number;

  @Column({ type: 'int' })
  productId: number;

  @Column()
  quantity: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    nullable: true,
  })
  status: OrderStatus | null;

  @Column({ nullable: true })
  cancelReason: string;

  @ManyToOne(() => Product, (product) => product.cartItems, { eager: true })
  product: Product;

  @ManyToOne(() => Payment, (payment) => payment.cartItems, { nullable: true })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @ManyToOne('Cart', (cart: any) => cart.cartItems)
  cart: Cart;

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
