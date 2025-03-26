// src/typeorm/entities/Product.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CartItem } from './CartItem';
import { Category } from './Category';
import { Shop } from './Shop';

@Entity()
export class Product {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column()
  name: string;

  @Column('float')
  price: number;

  @Column()
  amount: number;

  @Column({ default: 0 })
  sold: number;

  @Column({ nullable: true })
  discount: number;

  @Column()
  weight: number;

  @Column({ nullable: true, type: 'datetime' })
  startDate: Date;

  @Column({ nullable: true, type: 'datetime' })
  endDate: Date;

  @ManyToOne(() => Category, (category) => category.products, { eager: true })
  @JoinColumn()
  category: Category;

  @Column()
  tag: string;

  @Column()
  backgroundColor: string;

  @Column('text')
  description: string;

  @Column({ default: true })
  active: boolean;

  @Column({ nullable: true })
  img: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product)
  cartItems: CartItem[];

  @ManyToOne(() => Shop, (shop) => shop.products)
  shop: Shop;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  deletedAt: Date;
}
