import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/typeorm/entities/Account';
import { Repository } from 'typeorm';
import { CreateAccountDto } from './dtos/create.dto';
import { UpdateAccountDto } from './dtos/update.dto';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account) private accountReponsitory: Repository<Account>,
  ) {}

  async findAll() {
    // finAdd là hàm gọi ra tất cả acount
    return await this.accountReponsitory.find();
  }

  async findOne(id: number) {
    // findOne gọi ra từng acount chỉ định theo idAccount
    return await this.accountReponsitory.findOne({ where: { idAccount: id } });
  }

  /**
   * Tìm kiếm một tài khoản dựa trên idUser.
   * @param userId ID của User liên kết với Account.
   * @returns Promise<Account | null> Trả về Account nếu tìm thấy, ngược lại null.
   */
  async findByUserId(userId: number): Promise<Account | null> {
    // Giả định rằng entity Account có một trường hoặc quan hệ tên là 'idUser' hoặc 'user' với thuộc tính 'idUser'
    // Nếu tên trường trong entity Account của bạn khác, ví dụ là 'userId', hãy thay thế 'idUser: userId' bằng 'userId: userId'
    return await this.accountReponsitory.findOne({ where: { idUser: userId } });
  }

  async remove(id: number) {
    const findAccount = await this.findOne(id);
    if (!findAccount) {
      throw new Error('Account not found');
    } else {
      return this.accountReponsitory.remove(findAccount);
    }
  }

  async create(createAccountDto: CreateAccountDto) {
    const newAccount = {
      ...createAccountDto,
    };

    const newInstance = this.accountReponsitory.create(newAccount);

    return await this.accountReponsitory.save(newInstance);
  }

  async update(id: number, updateAccountDto: UpdateAccountDto) {
    const account = await this.findOne(id);

    if (!account) {
      return null;
    } else {
      this.accountReponsitory.merge(account, updateAccountDto);

      return this.accountReponsitory.save(account);
    }
  }
  
}
