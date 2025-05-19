import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Category } from '../../typeorm/entities/Category';
import { Product } from '../../typeorm/entities/Product';

// Hàm để chuyển đổi từ camelCase sang dạng có khoảng trắng và dấu &
export function formatCategoryName(name: string): string {
  let formattedName = name.replace(/([A-Z])/g, ' $1').trim();
  formattedName = formattedName.replace(/ And /g, ' & ');
  return formattedName;
}

export const categoryImageUrls = {
  Vegetables: '/assets/images/imagePNG/vegetables_icon 1.png',
  Fruits: '/assets/images/imagePNG/fruits_icon 1.png',
  MeatsAndSeafood: '/assets/images/imagePNG/meats_icon 1.png',
  DairyAndEggs: '/assets/images/imagePNG/Dairy & Eggs.png',
  MilksAndDrinks: '/assets/images/imagePNG/milks_icon 1.png',
  BakeryAndSnacks: '/assets/images/imagePNG/bread_icon 1.png',
  GrainsAndCereals: '/assets/images/imagePNG/Grains & Cereals.png',
  SpicesAndCondiments: '/assets/images/imagePNG/Spices & Condiments.png',
  FrozenFoods: '/assets/images/imagePNG/Frozen Foods.png',
  OrganicAndHealthyFoods: '/assets/images/imagePNG/Organic & Healthy Foods.png',
  CannedAndPreservedFoods:
    '/assets/images/imagePNG/Canned & Preserved Foods.png',
  NutsAndSeeds: '/assets/images/imagePNG/Nuts & Seeds.png',
  OilsAndVinegars: '/assets/images/imagePNG/Oils & Vinegars.png',
  ReadyToEatMeals: '/assets/images/imagePNG/Ready-to-Eat Meals.png',
  BeveragesAndJuices: '/assets/images/imagePNG/Beverages & Juices.png',
  HerbsAndMushrooms: '/assets/images/imagePNG/Herbs & Mushrooms.png',
};

// Ánh xạ từ khóa camelCase sang tên hiển thị
export const categoryDisplayNames: Record<string, string> = {
  Vegetables: 'Vegetables',
  Fruits: 'Fruits',
  MeatsAndSeafood: 'Meats & Seafood',
  DairyAndEggs: 'Dairy & Eggs',
  MilksAndDrinks: 'Milks & Drinks',
  BakeryAndSnacks: 'Bakery & Snacks',
  GrainsAndCereals: 'Grains & Cereals',
  SpicesAndCondiments: 'Spices & Condiments',
  FrozenFoods: 'Frozen Foods',
  OrganicAndHealthyFoods: 'Organic & Healthy Foods',
  CannedAndPreservedFoods: 'Canned & Preserved Foods',
  NutsAndSeeds: 'Nuts & Seeds',
  OilsAndVinegars: 'Oils & Vinegars',
  ReadyToEatMeals: 'Ready To Eat Meals',
  BeveragesAndJuices: 'Beverages & Juices',
  HerbsAndMushrooms: 'Herbs & Mushrooms',
};

// Ánh xạ ngược từ tên hiển thị sang khóa camelCase
export const displayNameToKey: Record<string, string> = Object.entries(
  categoryDisplayNames,
).reduce((acc, [key, value]) => {
  acc[value] = key;
  return acc;
}, {});

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
      let categoryName =
        typeof productData.category === 'string'
          ? productData.category
          : (productData.category as Category)?.name;
      console.log('Received category name:', categoryName);

      if (categoryName) {
        // Kiểm tra xem categoryName có phải là tên hiển thị không
        // Nếu có, chuyển đổi về dạng camelCase để lưu trữ
        if (displayNameToKey[categoryName]) {
          categoryName = displayNameToKey[categoryName];
        }
        // Nếu không, thử xem có thể định dạng được không
        else if (!categoryDisplayNames[categoryName]) {
          // Kiểm tra xem đã có định dạng sẵn trong categoryDisplayNames chưa
          // Nếu chưa, hãy tạo một khóa camelCase mới
          const formattedName = formatCategoryName(categoryName);
          if (displayNameToKey[formattedName]) {
            categoryName = displayNameToKey[formattedName];
          }
        }

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
    const products = await this.productsRepository.find({
      where: {
        active: true,
      },
      relations: ['category'],
    });

    // Thêm thuộc tính displayCategoryName cho mỗi sản phẩm
    return products.map((product) => {
      if (product.category) {
        const displayName =
          categoryDisplayNames[product.category.name] ||
          formatCategoryName(product.category.name);
        (product as any).displayCategoryName = displayName;
      }
      return product;
    });
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

    // Thêm thuộc tính displayCategoryName
    if (product.category) {
      (product as any).displayCategoryName =
        categoryDisplayNames[product.category.name] ||
        formatCategoryName(product.category.name);
    }
    return product;
  }

  async update(
    id: string | number,
    productData: Partial<Product>,
  ): Promise<Product> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

    let categoryName =
      typeof productData.category === 'string'
        ? productData.category
        : (productData.category as Category)?.name;
    console.log('Received category name for update:', categoryName);

    if (categoryName) {
      // Kiểm tra xem categoryName có phải là tên hiển thị không
      if (displayNameToKey[categoryName]) {
        categoryName = displayNameToKey[categoryName];
      }
      // Nếu không, thử xem có thể định dạng được không
      else if (!categoryDisplayNames[categoryName]) {
        // Kiểm tra xem đã có định dạng sẵn trong categoryDisplayNames chưa
        // Nếu chưa, hãy tạo một khóa camelCase mới
        const formattedName = formatCategoryName(categoryName);
        if (displayNameToKey[formattedName]) {
          categoryName = displayNameToKey[formattedName];
        }
      }

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
    const product = await this.productsRepository.findOne({ where: { name } });
    if (product && product.category) {
      (product as any).displayCategoryName =
        categoryDisplayNames[product.category.name] ||
        formatCategoryName(product.category.name);
    }
    return product;
  }

  async searchProductsByName(searchTerm: string): Promise<Product[]> {
    // Validate và sanitize searchTerm
    if (!searchTerm || typeof searchTerm !== 'string') {
      console.log('Invalid searchTerm:', searchTerm);
      return [];
    }

    const sanitizedTerm = searchTerm.trim();

    try {
      const products = await this.productsRepository.find({
        where: {
          name: Like(`%${sanitizedTerm}%`),
          active: true,
        },
        relations: ['category', 'shop'],
        take: 5,
      });

      return products.map((product) => {
        if (product.category) {
          (product as any).displayCategoryName =
            categoryDisplayNames[product.category.name] ||
            formatCategoryName(product.category.name);
        }
        return product;
      });
    } catch (error) {
      console.error('Error in searchProductsByName:', error);
      throw error;
    }
  }

  async updateAllCategoryImages(): Promise<{ updated: number; total: number }> {
    try {
      const categories = await this.categoriesRepository.find();
      let updatedCount = 0;

      for (const category of categories) {
        const imageUrl = categoryImageUrls[category.name];
        if (
          imageUrl &&
          (!category.imageUrl || category.imageUrl !== imageUrl)
        ) {
          category.imageUrl = imageUrl;
          await this.categoriesRepository.save(category);
          updatedCount++;
          console.log(
            `Updated category '${category.name}' with image: ${imageUrl}`,
          );
        }
      }

      console.log(
        `Category image update completed. Updated ${updatedCount} of ${categories.length} categories.`,
      );
      return { updated: updatedCount, total: categories.length };
    } catch (error) {
      console.error('Error updating category images:', error);
      throw new Error(`Failed to update category images: ${error.message}`);
    }
  }

  async findOrCreateCategory(name: string): Promise<Category> {
    // Your existing code to determine categoryName
    let categoryName = name;
    if (displayNameToKey[name]) {
      categoryName = displayNameToKey[name];
    } else if (!categoryDisplayNames[name]) {
      const formattedName = formatCategoryName(name);
      if (displayNameToKey[formattedName]) {
        categoryName = displayNameToKey[formattedName];
      }
    }

    let category = await this.categoriesRepository.findOne({
      where: { name: categoryName },
    });

    if (!category) {
      // Get the image URL for this category if it exists
      const imageUrl = categoryImageUrls[categoryName];

      category = this.categoriesRepository.create({
        name: categoryName,
        imageUrl: imageUrl || null, // Add the image URL
      });
      await this.categoriesRepository.save(category);
      console.log(
        `Created new category '${categoryName}' with image: ${imageUrl || 'none'}`,
      );
    } else if (!category.imageUrl) {
      // If category exists but doesn't have an image URL, update it
      const imageUrl = categoryImageUrls[categoryName];
      if (imageUrl) {
        category.imageUrl = imageUrl;
        await this.categoriesRepository.save(category);
        console.log(
          `Updated existing category '${categoryName}' with image: ${imageUrl}`,
        );
      }
    }

    return category;
  }

  async findMostSold(limit: number = 10): Promise<Product[]> {
    const products = await this.productsRepository.find({
      where: { active: true },
      relations: ['category'],
      order: { sold: 'DESC' },
      take: limit,
    });

    return products.map((product) => {
      if (product.category) {
        (product as any).displayCategoryName =
          categoryDisplayNames[product.category.name] ||
          formatCategoryName(product.category.name);
      }
      return product;
    });
  }

  async findByCategory(categoryName: string): Promise<Product[]> {
    // Kiểm tra nếu categoryName là tên hiển thị
    let categoryKey = categoryName;
    if (displayNameToKey[categoryName]) {
      categoryKey = displayNameToKey[categoryName];
    }

    const products = await this.productsRepository.find({
      relations: ['category'],
      where: {
        category: {
          name: categoryKey,
        },
        active: true,
      },
    });

    return products.map((product) => {
      if (product.category) {
        (product as any).displayCategoryName =
          categoryDisplayNames[product.category.name] ||
          formatCategoryName(product.category.name);
      }
      return product;
    });
  }

  async findByCategoryForShop(
    shopId: number,
    categoryName?: string,
  ): Promise<Product[]> {
    // Tạo điều kiện where cơ bản
    const whereCondition: any = {
      shop: {
        id: shopId,
      },
      active: true,
    };

    // Chỉ thêm điều kiện category nếu có truyền categoryName
    if (categoryName) {
      let categoryKey = categoryName;
      if (displayNameToKey[categoryName]) {
        categoryKey = displayNameToKey[categoryName];
      }
      whereCondition.category = {
        name: categoryKey,
      };
    }

    const products = await this.productsRepository.find({
      relations: ['category'],
      where: whereCondition,
    });

    return products.map((product) => {
      if (product.category) {
        (product as any).displayCategoryName =
          categoryDisplayNames[product.category.name] ||
          formatCategoryName(product.category.name);
      }
      return product;
    });
  }
}
