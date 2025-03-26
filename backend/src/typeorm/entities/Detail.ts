import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Product } from './Product';

@Entity('details')
export class Detail {
  @PrimaryGeneratedColumn({ type: 'int' }) // ID tự tăng dạng số
  id: number;

  @Column()
  name: string;

  @Column()
  title: string;

  @Column('float')
  price: number;

  @Column('int')
  discount: number;

  @Column('simple-array') // Lưu mảng dưới dạng chuỗi phân tách bằng dấu phẩy
  images: string[];

  @Column('int')
  sold: number;

  @Column()
  timeLeft: string;

  @Column('simple-array')
  categories: string[];

  @Column('json') // Lưu object description dưới dạng JSON
  description: {
    text: string;
    variants: string[];
    image: string;
  };

  @Column({ nullable: true })
  productId: number;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  deletedAt: Date;
}
