import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOfferDto } from './dto/create-offer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Offer } from './entities/offer.entity';
import { DataSource, Repository } from 'typeorm';
import { WishesService } from '../wishes/wishes.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OffersService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    private readonly wishesService: WishesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(user: User, createOfferDto: CreateOfferDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wish = await this.wishesService.findByIdWithOwner(
        createOfferDto.itemId,
      );
      if (!wish) {
        throw new NotFoundException('Подарок не найден');
      }

      if (wish.owner.id === user.id) {
        throw new ConflictException('Вы не можете скидываться на свои подарки');
      }

      const total = Number(wish.raised) + Number(createOfferDto.amount);
      if (total > Number(wish.price)) {
        throw new BadRequestException(
          'Ожидаемая сумма собранных средств превышает стоимость подарка',
        );
      }

      await this.wishesService.updateWishRaisedSum(
        createOfferDto.itemId,
        total,
      );
      const offer = await this.offerRepository.save({
        ...createOfferDto,
        user,
        item: wish,
      });
      await queryRunner.commitTransaction();
      return offer;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return await this.offerRepository.find({
      relations: ['item', 'user'],
    });
  }

  async findOne(id: number) {
    const offer = await this.offerRepository.findOne({
      where: { id },
      relations: ['item', 'user'],
    });

    if (!offer) {
      throw new NotFoundException('Предложение не найдено');
    }
    return offer;
  }
}
