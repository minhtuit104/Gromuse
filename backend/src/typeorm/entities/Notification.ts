import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CartItem, OrderStatus } from './CartItem';
import { Product } from './Product';
import { Rating } from './Rating';
import { Shop } from './Shop';
import { User } from './User';

// Định nghĩa các loại nội dung thông báo
export enum NotificationContentType {
  PRODUCT_RATED = 'PRODUCT_RATED',
  // Kế thừa từ OrderStatus
  TO_ORDER = OrderStatus.TO_ORDER,
  TO_RECEIVE = OrderStatus.TO_RECEIVE,
  COMPLETE = OrderStatus.COMPLETE,
  CANCEL_BYSHOP = OrderStatus.CANCEL_BYSHOP,
  CANCEL_BYUSER = OrderStatus.CANCEL_BYUSER,
}

export enum NotificationRecipientType {
  USER = 'USER',
  SHOP = 'SHOP',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
    comment: 'ID của người dùng hoặc shop nhận thông báo',
  })
  recipientId: number;

  @Column({
    type: 'enum',
    enum: NotificationRecipientType,
    comment: 'Loại người nhận: USER hoặc SHOP',
  })
  recipientType: NotificationRecipientType;

  @Column({
    type: 'enum',
    enum: NotificationContentType,
  })
  type: NotificationContentType;

  @Column('text', { comment: 'Nội dung chính của thông báo' })
  message: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ type: 'boolean', default: false, comment: 'Đã đọc hay chưa' })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  relatedUserId: number | null;

  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'relatedUserId', referencedColumnName: 'idUser' })
  relatedUser: User | null;

  @Column({ type: 'int', nullable: true })
  relatedShopId: number | null;

  @ManyToOne(() => Shop, { nullable: true, eager: false })
  @JoinColumn({ name: 'relatedShopId' })
  relatedShop: Shop | null;

  @Column({ type: 'int', nullable: true })
  relatedProductId: number | null;

  @ManyToOne(() => Product, { nullable: true, eager: false })
  @JoinColumn({ name: 'relatedProductId' })
  relatedProduct: Product | null;

  @Column({ type: 'int', nullable: true })
  relatedCartItemId: number | null;

  @ManyToOne(() => CartItem, { nullable: true, eager: false })
  @JoinColumn({ name: 'relatedCartItemId' })
  relatedCartItem: CartItem | null;

  @Column({ type: 'int', nullable: true })
  relatedRatingId: number | null;

  @ManyToOne(() => Rating, { nullable: true, eager: false })
  @JoinColumn({ name: 'relatedRatingId' })
  relatedRating: Rating | null;
}
