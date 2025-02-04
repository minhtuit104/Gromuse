import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './typeorm/entities/User';
import { UserModule } from './modules/users/user.module';
import { Account } from './typeorm/entities/Account';
import { AccountModule } from './modules/account/account.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      database: "web_gromuse",
      username: "root",
      password: "12345",
      port: 3306,
      host: "localhost",
      type: "mysql",
      autoLoadEntities: true,
      entities: [User, Account],
      synchronize: true,
    }),
    AuthModule,
    UserModule,
    AccountModule    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
