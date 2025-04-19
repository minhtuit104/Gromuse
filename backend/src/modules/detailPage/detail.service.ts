import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Detail } from '../../typeorm/entities/Detail';
import { Product } from '../../typeorm/entities/Product';
import { CreateDetailDto } from './dtos/create-detail.dto';
import { UpdateDetailDto } from './dtos/update-detail.dto';

@Injectable()
export class DetailService {
  constructor(
    @InjectRepository(Detail)
    private detailRepository: Repository<Detail>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createDetailDto: CreateDetailDto): Promise<Detail> {
    const detail = this.detailRepository.create(createDetailDto);
    const savedDetail = await this.detailRepository.save(detail);

    // Tạo Product tương ứng
    const product = await this.productRepository.save({
      name: createDetailDto.name,
      price: createDetailDto.price,
      weight: 100, // Giả định
      tag: '🏷️ Default Tag',
      category: { name: createDetailDto.categories[0] || 'Default' },
    });

    savedDetail.productId = product.id;
    await this.detailRepository.save(savedDetail);
    return savedDetail;
  }

  async findOne(id: number) {
    const detail = await this.detailRepository.findOne({
      where: { id },
      relations: ['product'],
    });
    if (!detail) {
      throw new NotFoundException(`Detail with ID ${id} not found`);
    }
    return detail;
  }

  async getShopForDetail(detailId: number) {
    // Giả lập dữ liệu shop cứng
    return {
      id: 1,
      name: "Lay's Việt Nam",
      avatar: 'https://example.com/avatar.png',
    };
  }

  async update(id: number, updateDetailDto: UpdateDetailDto): Promise<Detail> {
    await this.detailRepository.update(id, updateDetailDto);
    return this.detailRepository.findOne({ where: { id } });
  }
}
