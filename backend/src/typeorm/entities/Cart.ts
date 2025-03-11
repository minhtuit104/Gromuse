import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from './Product';

@Entity()
export class CartItem {
  @PrimaryGeneratedColumn({type: 'int'})
  id: number;

  @Column({type: 'int'})
  productId: number;

  @Column()
  quantity: number;

  @ManyToOne(() => Product, product => product.cartItems, { eager: true })
  product: Product;
}