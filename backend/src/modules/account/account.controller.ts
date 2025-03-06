import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from "@nestjs/common"; 
import { AccountService } from "./account.service";
import { UpdateAccountDto } from "./dtos/update.dto"; 
import {JwtAuthGuard} from "../auth/jwtAuthGuard/jwtAuthGuard"; 
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger"; 

@ApiBearerAuth()  
@ApiTags('Accounts') 
@Controller('api/v1/accounts') 
export class AccountController{ 

    constructor(private accountService: AccountService) {} 

    @Get() 
    @UseGuards(JwtAuthGuard) 
    findAll(){ 
        return this.accountService.findAll(); 
    } 
    
    @Get('/:id') 
    @UseGuards(JwtAuthGuard) 
    findOne(@Param('id') id: number){ 
        return this.accountService.findOne(id); 
    }

    @Delete('/:id') 
    @UseGuards(JwtAuthGuard) 
    remove(@Param('id') id: number){ 
        return this.accountService.remove(id); 
    }

    // @Post()
    // create(@Body() createAccountDto: CreateAccountDto){
    //     return this.accountService.create(createAccountDto);
    // }
    
    @Put('/:id') 
    @UseGuards(JwtAuthGuard) 
    update(@Param('id') id: number, @Body() updateAccountDto: UpdateAccountDto){ 
        return this.accountService.update(id, updateAccountDto); 
    }
}