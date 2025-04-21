import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
} from 'typeorm';
import { User } from './User';
import { Product } from './Product';
import { CartItem } from './CartItem';

@Entity('ratings')
export class Rating {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  productId: number;

  @Column({ type: 'int', unique: true })
  cartItemId: number;

  @Column({ type: 'int', comment: 'Rating score from 1 to 5' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column('simple-array', { nullable: true })
  images: string[];

  @ManyToOne(() => User, (user) => user.ratings)
  @JoinColumn({ name: 'userId', referencedColumnName: 'idUser' })
  user: User;

  @ManyToOne(() => Product, (product) => product.ratings)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @OneToOne(() => CartItem, (cartItem) => cartItem.rating)
  @JoinColumn({ name: 'cartItemId' })
  cartItem: CartItem;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
