/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions } from 'typeorm';
import { Offer } from '../entities/offer.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private offersRepository: Repository<Offer>,
  ) {}

  async create(offerData: Partial<Offer>): Promise<Offer> {
    const offer = this.offersRepository.create(offerData);
    return this.offersRepository.save(offer);
  }

  async findMany(query: FindManyOptions<Offer> = {}): Promise<Offer[]> {
    const defaultOptions: FindManyOptions<Offer> = {
      relations: ['user', 'item'],
      ...query,
    };
    return this.offersRepository.find(defaultOptions);
  }

  async findOne(query: FindOneOptions<Offer>): Promise<Offer | null> {
    const defaultOptions: FindOneOptions<Offer> = {
      relations: ['user', 'item'],
      ...query,
    };
    return this.offersRepository.findOne(defaultOptions);
  }

  async updateOne(
    query: FindOneOptions<Offer>,
    updateData: Partial<Offer>,
  ): Promise<Offer | null> {
    const offer = await this.findOne(query);
    if (!offer) return null;

    Object.assign(offer, updateData);
    return this.offersRepository.save(offer);
  }

  async removeOne(query: FindOneOptions<Offer>): Promise<boolean> {
    const offer = await this.findOne(query);
    if (!offer) return false;

    await this.offersRepository.remove(offer);
    return true;
  }

  async findAll(): Promise<Offer[]> {
    return this.findMany();
  }

  async findById(id: number): Promise<Offer | null> {
    return this.findOne({ where: { id } });
  }

  async findByWish(wishId: number): Promise<Offer[]> {
    return this.findMany({ where: { item: { id: wishId } } });
  }

  async findByUser(userId: number): Promise<Offer[]> {
    return this.findMany({ where: { user: { id: userId } } });
  }

  async update(id: number, offerData: Partial<Offer>): Promise<Offer | null> {
    return this.updateOne({ where: { id } }, offerData);
  }

  async remove(id: number): Promise<boolean> {
    return this.removeOne({ where: { id } });
  }

  async findOffersWithDetails(): Promise<Offer[]> {
    return this.findMany({
      relations: [
        'user',
        'item',
        'item.owner',
        'item.wishlist',
        'item.wishlist.user',
      ],
    });
  }

  async findOfferWithFullDetails(id: number): Promise<Offer | null> {
    return this.findOne({
      where: { id },
      relations: [
        'user',
        'item',
        'item.owner',
        'item.wishlist',
        'item.wishlist.user',
      ],
    });
  }

  async canUpdateOffer(offerId: number, userId: number): Promise<boolean> {
    const offer = await this.findById(offerId);

    if (!offer) {
      throw new NotFoundException(`Предложение с ID ${offerId} не найдено`);
    }

    if (offer.userId !== userId) {
      throw new ForbiddenException('Вы не можете изменять чужие предложения');
    }

    return true;
  }

  async canDeleteOffer(offerId: number, userId: number): Promise<boolean> {
    const offer = await this.findById(offerId);

    if (!offer) {
      throw new NotFoundException(`Предложение с ID ${offerId} не найдено`);
    }

    if (offer.userId !== userId) {
      throw new ForbiddenException('Вы не можете удалять чужие предложения');
    }

    return true;
  }

  async updateOfferSafely(
    offerId: number,
    userId: number,
    updateData: Partial<Offer>,
  ): Promise<Offer> {
    await this.canUpdateOffer(offerId, userId);

    const {
      id,
      userId: newUserId,
      itemId,
      user,
      item,
      ...safeUpdateData
    } = updateData;

    const updatedOffer = await this.update(offerId, safeUpdateData);

    if (!updatedOffer) {
      throw new NotFoundException(`Предложение с ID ${offerId} не найдено`);
    }

    return updatedOffer;
  }

  async deleteOfferSafely(offerId: number, userId: number): Promise<boolean> {
    await this.canDeleteOffer(offerId, userId);

    const result = await this.remove(offerId);

    if (!result) {
      throw new NotFoundException(`Предложение с ID ${offerId} не найдено`);
    }

    return result;
  }
}
