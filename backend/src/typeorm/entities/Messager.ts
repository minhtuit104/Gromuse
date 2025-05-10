import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity({ name: 'messager' })
export class Messager {
  @PrimaryGeneratedColumn({ type: 'int' })
  idMessager: number;

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ type: 'timestamp' })
  createAt: Date;

  @ManyToOne(() => User, (user) => user.sentMessagers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedMessagers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receiverId' })
  receiver: User;
}
