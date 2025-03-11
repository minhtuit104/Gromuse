import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Product } from './Product';

@Entity()
export class Category {
  @PrimaryGeneratedColumn({type: 'int'})
  id: number;

  @Column({ unique: true })
  name: string; 

  @OneToMany(() => Product, product => product.category)
  products: Product[];
}