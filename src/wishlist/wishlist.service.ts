import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Wishlist } from './entities/wishlist.entity';
import { Repository } from 'typeorm';
import { WishesService } from '../wishes/wishes.service';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    private readonly wishesService: WishesService,
  ) {}

  async create(user: User, createWishlistDto: CreateWishlistDto) {
    const items = await this.wishesService.findManyByIds(
      createWishlistDto.itemsId,
    );
    const wishlist = await this.wishlistRepository.save({
      items,
      owner: user,
      name: createWishlistDto.name,
      description: createWishlistDto.description,
      image: createWishlistDto.image,
    });
    return await this.wishlistRepository.findOne({
      where: { id: wishlist.id },
      relations: ['owner', 'items'],
    });
  }

  async findAll() {
    return await this.wishlistRepository.find({
      relations: ['owner', 'items'],
    });
  }

  async findById(id: number) {
    const wishlist = await this.wishlistRepository.findOne({
      where: { id },
      relations: ['owner', 'items'],
    });

    if (!wishlist) {
      throw new NotFoundException('Список подарков не найден');
    }
    return wishlist;
  }

  async update(
    wishlistId: number,
    userId: number,
    updateWishlistDto: UpdateWishlistDto,
  ) {
    const wishlist = await this.findById(wishlistId);
    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException(
        'Вы не можете изменять чужие списки подарков',
      );
    }

    const wishes = await this.wishesService.findManyByIds(
      updateWishlistDto.itemsId || [],
    );

    await this.wishlistRepository.save({
      ...wishlist,
      name: updateWishlistDto.name,
      image: updateWishlistDto.image,
      description: updateWishlistDto.description,
      items: wishes,
    });
    return await this.findById(wishlistId);
  }

  async remove(wishlistId: number, userId: number) {
    const wishlist = await this.findById(wishlistId);
    if (wishlist.owner.id !== userId) {
      throw new ForbiddenException(
        'Вы не можете удалять чужие списки подарков',
      );
    }
    await this.wishlistRepository.delete(wishlistId);
    return wishlist;
  }
}
