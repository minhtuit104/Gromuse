import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { CartItem } from './Cart';
import { Category } from './Category';

@Entity()
export class Product {
  @PrimaryGeneratedColumn({type: 'int'})
  id: number;

  @Column()
  name: string;

  @Column('float')
  price: number;

  @Column()
  amount: number;

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

  @OneToMany(() => CartItem, cartItem => cartItem.product)
  cartItems: CartItem[];
}