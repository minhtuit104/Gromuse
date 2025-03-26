import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Detail } from '../../typeorm/entities/Detail';
import { Product } from '../../typeorm/entities/Product';
import { DetailController } from './detail.controller';
import { DetailService } from './detail.service';

@Module({
  imports: [TypeOrmModule.forFeature([Detail, Product])],
  controllers: [DetailController],
  providers: [DetailService],
})
export class DetailModule {}
