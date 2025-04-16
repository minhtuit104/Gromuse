import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Address } from './Address';
import { Voucher } from './Voucher';
import { Shop } from './Shop';
import { CartItem } from './CartItem';

export enum PaymentMethod {
  ONLINE = 'online',
  COD = 'cod',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.COD,
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  deliveryFeeOriginal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  deliveryFeeDiscounted: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  couponDiscount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column()
  cartId: number;

  @Column('json')
  cartItemIds: number[];

  @Column()
  phone: string;

  @Column()
  address: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
  @OneToMany(() => CartItem, (cartItem) => cartItem.payment)
  cartItems: CartItem[];

  @OneToOne(() => Shop, (shop) => shop.payment)
  shop: Shop;

  @ManyToMany(() => Voucher, (voucher) => voucher.payments)
  @JoinTable()
  vouchers: Voucher[];
}
