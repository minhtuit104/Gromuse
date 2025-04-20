import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { CartItem } from './CartItem';
import { Category } from './Category';
import { Shop } from './Shop';
import { Rating } from './Rating';

@Entity()
export class Product {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column()
  name: string;

  @Column('float')
  price: number;

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

  @OneToMany(() => Rating, (rating) => rating.product)
  ratings: Rating[];

  @Column({
    type: 'float',
    precision: 2,
    scale: 1,
    default: 0.0,
    comment: 'Average Rating',
  })
  averageRating: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
