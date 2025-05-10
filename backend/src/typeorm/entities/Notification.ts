import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  DeleteDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Shop } from './Shop';
import { Product } from './Product';
import { CartItem } from './CartItem';
import { Rating } from './Rating';

// Định nghĩa các loại nội dung thông báo
export enum NotificationContentType {
  ORDER_ACCEPTED = 'ORDER_ACCEPTED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_CANCELLED_BY_USER = 'ORDER_CANCELLED_BY_USER',
  ORDER_CANCELLED_BY_SHOP = 'ORDER_CANCELLED_BY_SHOP',
  NEW_ORDER_FOR_SHOP = 'NEW_ORDER_FOR_SHOP',
  PRODUCT_RATED = 'PRODUCT_RATED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  PROMOTION = 'PROMOTION',
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
  redirectUrl: string | null;

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
