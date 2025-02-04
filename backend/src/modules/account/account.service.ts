import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Account } from "src/typeorm/entities/Account";
import { Repository } from "typeorm";
import { CreateAccountDto } from "./dtos/create.dto";
import { UpdateAccountDto } from "./dtos/update.dto";

@Injectable()

export class AccountService{

    constructor(@InjectRepository(Account) private accountReponsitory: Repository<Account>) {}

    async findAll(){
        return await this.accountReponsitory.find();
    }
    

    async findOne(id: number){
        return await this.accountReponsitory.findOne({where: {idAccount: id}});
    }

    async remove(id: number){
        const findAccount =  await this.findOne(id);
        if(!findAccount){
            throw new Error('Account not found');
        }else{
            return this.accountReponsitory.remove(findAccount);
        }
    }

    async create(createAccountDto: CreateAccountDto){
        const newAccount = {
            ...createAccountDto,
        };

        const newInstance = this.accountReponsitory.create(newAccount);

        return await this.accountReponsitory.save(newInstance);
    }
    
    async update(id: number , updateAccountDto: UpdateAccountDto){
        const account = await this.findOne(id);

        if(!account){
            return null;
        }else{
            this.accountReponsitory.merge(account, updateAccountDto);

            return this.accountReponsitory.save(account);
        }
    }
}