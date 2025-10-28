import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { Wishlist } from '../entities/wishlist.entity';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistsRepository: Repository<Wishlist>,
  ) {}

  // CRUD методы с query-фильтрами
  async create(wishlistData: Partial<Wishlist>): Promise<Wishlist> {
    const wishlist = this.wishlistsRepository.create(wishlistData);
    return this.wishlistsRepository.save(wishlist);
  }

  async findMany(query: FindManyOptions<Wishlist> = {}): Promise<Wishlist[]> {
    const defaultOptions: FindManyOptions<Wishlist> = {
      relations: ['user', 'items'],
      ...query,
    };
    return this.wishlistsRepository.find(defaultOptions);
  }

  async findOne(query: FindOneOptions<Wishlist>): Promise<Wishlist | null> {
    const defaultOptions: FindOneOptions<Wishlist> = {
      relations: ['user', 'items'],
      ...query,
    };
    return this.wishlistsRepository.findOne(defaultOptions);
  }

  async updateOne(
    query: FindOneOptions<Wishlist>,
    updateData: Partial<Wishlist>,
  ): Promise<Wishlist | null> {
    const wishlist = await this.findOne(query);
    if (!wishlist) return null;

    Object.assign(wishlist, updateData);
    return this.wishlistsRepository.save(wishlist);
  }

  async removeOne(query: FindOneOptions<Wishlist>): Promise<boolean> {
    const wishlist = await this.findOne(query);
    if (!wishlist) return false;

    await this.wishlistsRepository.remove(wishlist);
    return true;
  }

  async findAll(): Promise<Wishlist[]> {
    return this.findMany();
  }

  async findById(id: number): Promise<Wishlist | null> {
    return this.findOne({ where: { id } });
  }

  async findByUser(userId: number): Promise<Wishlist[]> {
    return this.findMany({ where: { user: { id: userId } } });
  }

  async update(
    id: number,
    wishlistData: Partial<Wishlist>,
  ): Promise<Wishlist | null> {
    return this.updateOne({ where: { id } }, wishlistData);
  }

  async remove(id: number): Promise<boolean> {
    return this.removeOne({ where: { id } });
  }

  async canUpdateWishlist(
    wishlistId: number,
    userId: number,
  ): Promise<boolean> {
    const wishlist = await this.findById(wishlistId);

    if (!wishlist) {
      throw new NotFoundException(`Вишлист с ID ${wishlistId} не найден`);
    }

    if (wishlist.userId !== userId) {
      throw new ForbiddenException('Вы не можете изменять чужие вишлисты');
    }

    return true;
  }

  async canDeleteWishlist(
    wishlistId: number,
    userId: number,
  ): Promise<boolean> {
    const wishlist = await this.findById(wishlistId);

    if (!wishlist) {
      throw new NotFoundException(`Вишлист с ID ${wishlistId} не найден`);
    }

    if (wishlist.userId !== userId) {
      throw new ForbiddenException('Вы не можете удалять чужие вишлисты');
    }

    return true;
  }

  async updateWishlistSafely(
    wishlistId: number,
    userId: number,
    updateData: Partial<Wishlist>,
  ): Promise<Wishlist> {
    await this.canUpdateWishlist(wishlistId, userId);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userId: newUserId, user, items, ...safeUpdateData } = updateData;

    const updatedWishlist = await this.update(wishlistId, safeUpdateData);

    if (!updatedWishlist) {
      throw new NotFoundException(`Вишлист с ID ${wishlistId} не найден`);
    }

    return updatedWishlist;
  }

  async deleteWishlistSafely(
    wishlistId: number,
    userId: number,
  ): Promise<boolean> {
    await this.canDeleteWishlist(wishlistId, userId);

    const result = await this.remove(wishlistId);

    if (!result) {
      throw new NotFoundException(`Вишлист с ID ${wishlistId} не найден`);
    }

    return result;
  }
}
