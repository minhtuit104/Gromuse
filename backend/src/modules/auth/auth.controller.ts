import { Body, Controller, HttpException, HttpStatus, Post, Response } from "@nestjs/common";
import { CreateUserDto } from "../users/dto/create.dto";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dtos/login.dto";
import { ApiTags } from "@nestjs/swagger";
  
@ApiTags('Auth')  
@Controller('api/v1/auth')
export class AuthController{
    constructor(private readonly authService: AuthService){} 

    @Post('/register')
    async create(@Body() createUserDto: CreateUserDto,@Response() res){  
        try { 
            //lấy kết quả trả về từ service
            await this.authService.register(createUserDto);
            return res.status(201).json({
                status: 201,
                message: 'Register success!', 
            });
        } catch (error) { 
            return res.status(400).json({ 
                status: 400, 
                message: error, 
            }); 
        }
    }
 
    @Post('/login') 
    async login(@Body() loginDto: LoginDto, @Response() res){
        try { 
            const data =  await this.authService.login(loginDto); 

            return res.status(HttpStatus.OK).json({
                status: HttpStatus.OK, 
                message: 'Login success!', 
                data,  
            });

        } catch (error) { 
            return res.status(400).json({ 
                status: 400, 
                message: error, 
            }); 
                
        }
    }
}