import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
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
  paymentId: number | null;
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
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne(() => Payment, (payment) => payment.cartItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment | null;

  @ManyToOne(() => Cart, (cart) => cart.cartItems)
  @JoinColumn({ name: 'cartId' })
  cart: Cart;

  @Column({ type: 'int' })
  cartId: number;

  @ManyToOne(() => Shop, (shop) => shop.cartItems, { nullable: true })
  @JoinColumn({ name: 'shopId' })
  shop: Shop | null;

  @Column({ type: 'int', nullable: true })
  shopId: number | null;

  @Column({ type: 'boolean', default: false })
  isPaid: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
