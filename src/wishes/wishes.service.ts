import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { Wish } from '../entities/wish.entity';

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private wishesRepository: Repository<Wish>,
  ) {}

  async create(wishData: Partial<Wish>): Promise<Wish> {
    const wish = this.wishesRepository.create(wishData);
    return this.wishesRepository.save(wish);
  }

  async findMany(query: FindManyOptions<Wish> = {}): Promise<Wish[]> {
    const defaultOptions: FindManyOptions<Wish> = {
      relations: ['owner', 'wishlist', 'offers'],
      ...query,
    };
    return this.wishesRepository.find(defaultOptions);
  }

  async findOne(query: FindOneOptions<Wish>): Promise<Wish | null> {
    const defaultOptions: FindOneOptions<Wish> = {
      relations: ['owner', 'wishlist', 'offers'],
      ...query,
    };
    return this.wishesRepository.findOne(defaultOptions);
  }

  async updateOne(
    query: FindOneOptions<Wish>,
    updateData: Partial<Wish>,
  ): Promise<Wish | null> {
    const wish = await this.findOne(query);
    if (!wish) return null;

    Object.assign(wish, updateData);
    return this.wishesRepository.save(wish);
  }

  async removeOne(query: FindOneOptions<Wish>): Promise<boolean> {
    const wish = await this.findOne(query);
    if (!wish) return false;

    await this.wishesRepository.remove(wish);
    return true;
  }

  async findAll(): Promise<Wish[]> {
    return this.findMany();
  }

  async findById(id: number): Promise<Wish | null> {
    return this.findOne({ where: { id } });
  }

  async findByWishlist(wishlistId: number): Promise<Wish[]> {
    return this.findMany({ where: { wishlist: { id: wishlistId } } });
  }

  async findByOwner(ownerId: number): Promise<Wish[]> {
    return this.findMany({ where: { owner: { id: ownerId } } });
  }

  async update(id: number, wishData: Partial<Wish>): Promise<Wish | null> {
    return this.updateOne({ where: { id } }, wishData);
  }

  async remove(id: number): Promise<boolean> {
    return this.removeOne({ where: { id } });
  }

  async findWishWithOffers(id: number): Promise<Wish | null> {
    return this.findOne({
      where: { id },
      relations: [
        'owner',
        'wishlist',
        'wishlist.user',
        'offers',
        'offers.user',
      ],
    });
  }

  async findWishesWithFullDetails(): Promise<Wish[]> {
    return this.findMany({
      relations: [
        'owner',
        'wishlist',
        'wishlist.user',
        'offers',
        'offers.user',
      ],
    });
  }

  async calculateTotalRaised(wishId: number): Promise<number> {
    const wish = await this.findById(wishId);
    if (!wish) return 0;

    const totalOffers =
      wish.offers?.reduce((sum, offer) => sum + Number(offer.amount), 0) || 0;
    return totalOffers;
  }

  async canUpdateWish(wishId: number, userId: number): Promise<boolean> {
    const wish = await this.findById(wishId);

    if (!wish) {
      throw new NotFoundException(`Подарок с ID ${wishId} не найден`);
    }

    if (wish.ownerId !== userId) {
      throw new ForbiddenException('Вы не можете изменять чужие подарки');
    }

    return true;
  }

  async canDeleteWish(wishId: number, userId: number): Promise<boolean> {
    const wish = await this.findById(wishId);

    if (!wish) {
      throw new NotFoundException(`Подарок с ID ${wishId} не найден`);
    }

    if (wish.ownerId !== userId) {
      throw new ForbiddenException('Вы не можете удалять чужие подарки');
    }

    return true;
  }

  async canUpdatePrice(wishId: number, newPrice?: number): Promise<boolean> {
    if (newPrice === undefined) {
      return true;
    }

    const wish = await this.findWishWithOffers(wishId);

    if (!wish) {
      throw new NotFoundException(`Подарок с ID ${wishId} не найден`);
    }

    const hasOffers = wish.offers && wish.offers.length > 0;

    if (hasOffers) {
      throw new BadRequestException(
        'Нельзя изменять стоимость подарка, на который уже есть заявки',
      );
    }

    return true;
  }

  async updateWishSafely(
    wishId: number,
    userId: number,
    updateData: Partial<Wish>,
  ): Promise<Wish> {
    await this.canUpdateWish(wishId, userId);

    await this.canUpdatePrice(wishId, updateData.price as number);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { raised, ownerId, offers, ...safeUpdateData } = updateData;

    if (raised !== undefined) {
      throw new BadRequestException(
        'Поле "raised" вычисляется автоматически и недоступно для изменения',
      );
    }

    const updatedWish = await this.update(wishId, safeUpdateData);

    if (!updatedWish) {
      throw new NotFoundException(`Подарок с ID ${wishId} не найден`);
    }

    const totalRaised = await this.calculateTotalRaised(wishId);
    if (updatedWish.raised !== totalRaised) {
      updatedWish.raised = totalRaised;
      await this.wishesRepository.save(updatedWish);
    }

    return updatedWish;
  }

  async deleteWishSafely(wishId: number, userId: number): Promise<boolean> {
    await this.canDeleteWish(wishId, userId);

    const result = await this.remove(wishId);

    if (!result) {
      throw new NotFoundException(`Подарок с ID ${wishId} не найден`);
    }

    return result;
  }

  async updateRaisedAmount(wishId: number): Promise<Wish | null> {
    const wish = await this.findWishWithOffers(wishId);

    if (!wish) {
      throw new NotFoundException(`Подарок с ID ${wishId} не найден`);
    }

    const totalRaised = await this.calculateTotalRaised(wishId);
    wish.raised = totalRaised;

    return this.wishesRepository.save(wish);
  }
}
