import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../typeorm/entities/Product';
import { Category } from '../../typeorm/entities/Category';

export const tagMap: Record<string, string> = {
  Vegetables: '🏷️ Local Market',
  Fruits: '🏷️ Chemical Free',
  MeatsAndSeafood: '🏷️ Premium Quality',
  DairyAndEggs: '🏷️ Farm Fresh',
  MilksAndDrinks: '🏷️ Energy Boost',
  BakeryAndSnacks: '🏷️ In Store Delivery',
  GrainsAndCereals: '🏷️ Whole Nutrition',
  SpicesAndCondiments: '🏷️ Authentic Taste',
  FrozenFoods: '🏷️ Quick & Easy',
  OrganicAndHealthyFoods: '🏷️ Eco-Friendly',
  CannedAndPreservedFoods: '🏷️ Long Shelf Life',
  NutsAndSeeds: '🏷️ Superfood',
  OilsAndVinegars: '🏷️ Cold Pressed',
  ReadyToEatMeals: '🏷️ Convenience',
  BeveragesAndJuices: '🏷️ Refreshing',
  HerbsAndMushrooms: '🏷️ Medicinal Benefits',
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(productData: Partial<Product>): Promise<Product> {
    try {
      const categoryName =
        typeof productData.category === 'string'
          ? productData.category
          : (productData.category as Category)?.name;
      console.log('Received category name:', categoryName);

      if (categoryName) {
        let category = await this.categoriesRepository.findOne({
          where: { name: categoryName },
        });
        console.log('Found category:', category);
        if (!category) {
          category = this.categoriesRepository.create({ name: categoryName });
          await this.categoriesRepository.save(category);
          console.log('Created new category:', category);
        }
        productData.category = category; // Gán object Category vào productData
        productData.tag = tagMap[categoryName] || '🏷️ Default Tag';
      } else {
        // Nếu không có category, giữ nguyên hoặc xử lý mặc định (nếu cần)
        productData.category = null; // Hoặc để null nếu không yêu cầu category
      }

      const product = this.productsRepository.create(productData);
      const savedProduct = await this.productsRepository.save(product);
      console.log('Product saved successfully:', savedProduct);
      return savedProduct;
    } catch (error) {
      console.error('Error in product creation:', error);
      throw new Error(`Failed to save product: ${error.message}`);
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({ relations: ['category'] });
  }

  async findOne(id: number | string): Promise<Product> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const product = await this.productsRepository.findOne({
      where: { id: numericId },
      relations: ['category', 'shop'],
    });
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(
    id: string | number,
    productData: Partial<Product>,
  ): Promise<Product> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    const categoryName =
      typeof productData.category === 'string'
        ? productData.category
        : (productData.category as Category)?.name;
    console.log('Received category name for update:', categoryName);

    if (categoryName) {
      let category = await this.categoriesRepository.findOne({
        where: { name: categoryName },
      });
      console.log('Found category for update:', category);
      if (!category) {
        category = this.categoriesRepository.create({ name: categoryName });
        await this.categoriesRepository.save(category);
      }
      productData.category = category;
      productData.tag = tagMap[categoryName] || productData.tag;
    }

    const existingProduct = await this.productsRepository.findOne({
      where: { id: numericId },
    });
    if (!existingProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const updatedData = {
      ...existingProduct,
      ...productData,
      img: productData.img || existingProduct.img, // Giữ hình ảnh cũ nếu không có hình mới
    };

    await this.productsRepository.update(numericId, updatedData);
    return this.findOne(numericId);
  }

  async findOneByName(name: string): Promise<Product | undefined> {
    return this.productsRepository.findOne({ where: { name } });
  }

  async findOrCreateCategory(name: string): Promise<Category> {
    let category = await this.categoriesRepository.findOne({ where: { name } });
    if (!category) {
      category = this.categoriesRepository.create({ name });
      await this.categoriesRepository.save(category);
    }
    return category;
  }

  async findMostSold(limit: number = 10): Promise<Product[]> {
    return this.productsRepository.find({
      where: { active: true },
      relations: ['category'],
      order: { sold: 'DESC' },
      take: limit,
    });
  }
}
