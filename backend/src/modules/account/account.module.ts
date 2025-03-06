import { Module } from "@nestjs/common";
import { AccountController } from "./account.controller"; 
import { AccountService } from "./account.service";
import { Account } from "src/typeorm/entities/Account";
import { TypeOrmModule } from "@nestjs/typeorm"; 

@Module({
    imports: [TypeOrmModule.forFeature([Account])], 
    controllers: [AccountController], 
    providers: [AccountService], 
})

export class AccountModule{} 