import { Entity, PrimaryGeneratedColumn, JoinColumn, Column, OneToOne, BeforeInsert} from "typeorm";
import { User } from "./User";
import * as bcrypt from "bcrypt";

@Entity({name: 'account'})
export class Account{

    @PrimaryGeneratedColumn({type: 'int'})
    idAccount: number;
    
    @OneToOne(() => User, user => user.accounts)
    @JoinColumn({ name: 'idUser' })
    user: User;

    @Column({type: 'int'})
    idUser: number;

    @Column({type: 'varchar', length: 200, unique: true})
    email: string;

    @Column({type: 'varchar', length: 15, unique: true})
    phoneNumber: string;

    @Column({type: 'varchar', length: 200})
    password: string;

    @Column({type: 'varchar', length: 300})
    refreshToken: string;

    @Column({type: 'int', default: '1' })
    role: number;

    @BeforeInsert()
    hashPassword(){
        const salt = bcrypt.genSaltSync(10);
        //gán lại giá trị mật khẩu mã hóa cho trường password trc khi lưu vào db
        this.password = bcrypt.hashSync(this.password, salt);
    }
}