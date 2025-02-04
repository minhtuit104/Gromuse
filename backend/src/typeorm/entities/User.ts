import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./Account";

@Entity({name: 'user'})
export class User{
    @PrimaryGeneratedColumn({type: 'int'})
    idUser: number;

    @Column({type: 'varchar', length: 200})
    name: string;

    @Column({type: 'varchar', length: 200, unique: true})
    email: string;

    @Column({nullable: true, type: 'varchar'})
    birthday: string;

    @Column({type: 'varchar', length: 200, default: null})
    avarta: string;

    @Column({type: 'varchar', length: 15, unique: true})
    phoneNumber: string;

    @Column({nullable: true, type: 'varchar', length: 200})
    address: string;

    @Column({nullable: true, type: 'varchar', length: 20})
    sex: string;

    @OneToOne(() => Account, account => account.user)
    accounts: Account[];

}