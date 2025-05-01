// src/typeorm/entities/Voucher.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Payment } from './Payment';

export enum VoucherType {
  FREE_SHIP = 'Free Ship',
  DISCOUNT = 'Discount',
}

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'enum', enum: VoucherType })
  type: VoucherType;

  @Column({ unique: true })
  code: string;

  @Column()
  description: string;

  @Column({ type: 'int' })
  remaining: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrderValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  maxDiscountValue: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  deletedAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

}
