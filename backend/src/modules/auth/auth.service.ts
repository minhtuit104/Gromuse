import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { CreateUserDto } from "../users/dto/create.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/typeorm/entities/User";
import { Repository } from "typeorm";
import { Account } from "src/typeorm/entities/Account";
import { LoginDto } from "./dtos/login.dto";
import * as bcrypt from "bcrypt";
import { JwtService } from '@nestjs/jwt';

@Injectable()

export class AuthService{

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>, 
        @InjectRepository(Account) private accountReponsetory: Repository<Account>, 
        private jwtService: JwtService, 
    ){}  

    async register(createUserDto: CreateUserDto){  
 
        //kiểm tra xem idUser đã tồn tại hay chưa  
        const findUserByEmail = await this.userRepository.findOne({ 
            where:  
                {email: createUserDto.email},   
            }); 
 
        //kiểm tra 
        if(findUserByEmail){
            throw new HttpException('Email đã tồn tại', 400);   
        }else{  

            //tạo ra một đối tượng user
            const newUser: CreateUserDto = {
                
                name: createUserDto.name, 
                email: createUserDto.email, 
                birthday: createUserDto.birthday, 
                avarta: createUserDto.avarta, 
                password: createUserDto.password, 
                phoneNumber: createUserDto.phoneNumber, 
                address: createUserDto.address,
                sex: createUserDto.sex 
            }

            //khởi tạo newInstance
            const newUserInstance = await this.userRepository.save(newUser); 

            const newAccount =this.accountReponsetory.create({ 
                idUser: newUserInstance.idUser, 
                email: createUserDto.email, 
                phoneNumber: createUserDto.phoneNumber,  
                password: createUserDto.password, 
                refreshToken: "" 
            }); 
            return await this.accountReponsetory.save(newAccount); 
        }
 
    }

    async login(loginDto: LoginDto) { 

        const findUserByEmail = await this.accountReponsetory.findOne({  
            where: [
                { email: loginDto.identifier }, // tìm kiếm teo cột email 
                { phoneNumber: loginDto.identifier}, // tìm kiếm thao cột số đt  
            ] });
        if (!findUserByEmail) {
            throw new HttpException("Tài khoản chưa được đăng ký", HttpStatus.BAD_REQUEST); 
        } 
  
        const isPasswordValid = await bcrypt.compare(loginDto.password, findUserByEmail.password); 
        if (!isPasswordValid) {  
            throw new HttpException('Mật khẩu không chính xác!', HttpStatus.BAD_REQUEST); 
        } 

        const payload = {
            idAccount: findUserByEmail.idAccount,
            idUser: findUserByEmail.idUser,
            email: findUserByEmail.email,
            phoneNumber: findUserByEmail.phoneNumber,
            role: findUserByEmail.role,
        };

        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(payload),
            this.jwtService.signAsync(payload, {
                secret: 'THISISMYKEY',
                expiresIn: '1d'
            })
        ]);

        findUserByEmail.refreshToken = refresh_token;
        await this.accountReponsetory.save(findUserByEmail);

        const { password, ...userData } = findUserByEmail;

        return { ...userData, access_token };
    }
}