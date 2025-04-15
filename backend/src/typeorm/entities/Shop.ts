// src/typeorm/entities/Shop.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { CartItem } from './CartItem';
import { Payment } from './Payment';
import { Product } from './Product';

@Entity()
export class Shop {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  deliveryInfo: string;

  @OneToMany(() => CartItem, (cartItem) => cartItem.shop)
  cartItems: CartItem[];

  @OneToMany(() => Product, (product) => product.shop)
  products: Product[];

  @ManyToOne(() => Payment, (payment) => payment.shops, { nullable: true })
  payment: Payment;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}
