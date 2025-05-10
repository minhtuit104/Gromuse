import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from './Account';
import { Cart } from './Cart';
import { Rating } from './Rating';
import { Messager } from './Messager';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn({ type: 'int' })
  idUser: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  email: string;

  @Column({ nullable: true, type: 'varchar' })
  birthday: string;

  @Column({ type: 'varchar', length: 200, default: null })
  avarta: string;

  @Column({ type: 'varchar', length: 15, unique: true })
  phoneNumber: string;

  @Column({ nullable: true, type: 'varchar', length: 200 })
  address: string;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  sex: string;

  @OneToMany(() => Messager, (messager) => messager.sender)
  sentMessagers: Messager[];

  @OneToMany(() => Messager, (messager) => messager.receiver)
  receivedMessagers: Messager[];

  @OneToOne(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToOne(() => Cart, (cart) => cart.user)
  cart: Cart;

  @OneToMany(() => Rating, (rating) => rating.user)
  ratings: Rating[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  deletedAt: Date;
}
