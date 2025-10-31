import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWishDto } from './dto/create-wish.dto';
import { UpdateWishDto } from './dto/update-wish.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Wish } from './entities/wish.entity';
import { DataSource, In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

const LATEST_NUMBER = 40;
const TOP_NUMBER = 20;

@Injectable()
export class WishesService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishRepository: Repository<Wish>,
    private readonly dataSource: DataSource,
  ) {}
  async create(user: User, createWishDto: CreateWishDto) {
    return this.wishRepository.save({ ...createWishDto, owner: user });
  }

  async findLatest() {
    const wishes = await this.wishRepository.find({
      order: { createdAt: 'DESC' },
      take: LATEST_NUMBER,
      relations: ['owner'],
    });

    return wishes || [];
  }

  async findTop() {
    const wishes = await this.wishRepository.find({
      order: { copied: 'DESC' },
      take: TOP_NUMBER,
      relations: ['owner'],
    });

    return wishes || [];
  }

  async findById(id: number) {
    const wish = await this.wishRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }
    return wish;
  }

  async findByIdWithOwner(id: number) {
    const wish = await this.wishRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }
    return wish;
  }

  async findManyByIds(ids: number[]) {
    if (!ids.length) return [];

    return await this.wishRepository.find({
      where: { id: In(ids) },
    });
  }

  async assertWishPermission(wishId: number, userId: number) {
    const wish = await this.wishRepository.findOne({
      where: { id: wishId },
      relations: ['owner'],
    });

    if (!wish) {
      throw new NotFoundException('Подарок не найден');
    }
    if (wish.owner.id !== userId) {
      throw new ForbiddenException(
        'Вы не можете изменять или удалять чужие подарки',
      );
    }

    return wish;
  }

  async update(wishId: number, userId: number, updateWishDto: UpdateWishDto) {
    const wish = await this.assertWishPermission(wishId, userId);
    const hasRaisedSum = wish.raised > 0;
    if (hasRaisedSum) {
      throw new ConflictException(
        'Вы не можете изменять этот подарок, потому что на него уже есть желающие скинуться',
      );
    }
    if ('raised' in updateWishDto && updateWishDto.raised !== undefined) {
      throw new BadRequestException(
        'Вы не можете изменять сумму собранных средств у подарка',
      );
    }
    await this.wishRepository.update(wishId, updateWishDto);
    return this.findById(wishId);
  }

  async remove(wishId: number, userId: number) {
    const wish = await this.assertWishPermission(wishId, userId);
    await this.wishRepository.delete(wishId);
    return wish;
  }

  async copyWish(wishId: number, user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wish = await this.findByIdWithOwner(wishId);
      await this.wishRepository.update(wishId, { copied: wish.copied + 1 });
      const newWish = await this.create(user, {
        name: wish.name,
        link: wish.link,
        image: wish.image,
        price: wish.price,
        description: wish.description,
      });
      await queryRunner.commitTransaction();
      return newWish;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async updateWishRaisedSum(id: number, newAmount: number) {
    await this.wishRepository.update(id, { raised: newAmount });
    const updatedWish = await this.wishRepository.findOneBy({ id });
    if (!updatedWish) {
      throw new NotFoundException('Подарок не найден');
    }
    return updatedWish;
  }
}
