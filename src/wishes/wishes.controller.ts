import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WishesService } from './wishes.service';
import { Wish } from '../entities/wish.entity';
import { CreateWishDto } from '../dto/create-wish.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishes')
export class WishesController {
  constructor(private readonly wishesService: WishesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createWishDto: CreateWishDto, @Request() req) {
    // Устанавливаем ownerId из аутентифицированного пользователя
    createWishDto.ownerId = req.user.id;
    return this.wishesService.create(createWishDto);
  }

  @Get()
  findAll(@Query() query: any) {
    const findOptions: any = {};

    if (query.where) {
      try {
        findOptions.where = JSON.parse(query.where);
      } catch (e) {
        if (query.ownerId) findOptions.where = { owner: { id: query.ownerId } };
        if (query.wishlistId)
          findOptions.where = {
            ...findOptions.where,
            wishlist: { id: query.wishlistId },
          };
      }
    }

    if (query.relations) {
      findOptions.relations = query.relations.split(',');
    }

    if (query.take) findOptions.take = parseInt(query.take);
    if (query.skip) findOptions.skip = parseInt(query.skip);

    return this.wishesService.findMany(findOptions);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wishesService.findById(+id);
  }

  @Get(':id/offers')
  findWishWithOffers(@Param('id') id: string) {
    return this.wishesService.findWishWithOffers(+id);
  }

  @Get('wishlist/:wishlistId')
  findByWishlist(@Param('wishlistId') wishlistId: string) {
    return this.wishesService.findByWishlist(+wishlistId);
  }

  @Get('owner/:ownerId')
  findByOwner(@Param('ownerId') ownerId: string) {
    return this.wishesService.findByOwner(+ownerId);
  }

  @Get(':id/raised')
  calculateTotalRaised(@Param('id') id: string) {
    return this.wishesService.calculateTotalRaised(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWishDto: Partial<Wish>,
    @Request() req,
  ) {
    return this.wishesService.updateWishSafely(+id, req.user.id, updateWishDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.wishesService.deleteWishSafely(+id, req.user.id);
    return { success: result, message: 'Подарок успешно удален' };
  }
}
