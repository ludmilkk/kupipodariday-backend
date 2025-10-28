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
import { WishlistsService } from './wishlists.service';
import { Wishlist } from '../entities/wishlist.entity';
import { CreateWishlistDto } from '../dto/create-wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlists')
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createWishlistDto: CreateWishlistDto, @Request() req) {
    createWishlistDto.userId = req.user.id;
    return this.wishlistsService.create(createWishlistDto);
  }

  @Get()
  findAll(@Query() query: any) {
    const findOptions: any = {};

    if (query.where) {
      try {
        findOptions.where = JSON.parse(query.where);
      } catch (e) {
        if (query.userId) findOptions.where = { user: { id: query.userId } };
      }
    }

    if (query.relations) {
      findOptions.relations = query.relations.split(',');
    }

    if (query.take) findOptions.take = parseInt(query.take);
    if (query.skip) findOptions.skip = parseInt(query.skip);

    return this.wishlistsService.findMany(findOptions);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wishlistsService.findById(+id);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.wishlistsService.findByUser(+userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWishlistDto: Partial<Wishlist>,
    @Request() req,
  ) {
    return this.wishlistsService.updateWishlistSafely(
      +id,
      req.user.id,
      updateWishlistDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.wishlistsService.deleteWishlistSafely(
      +id,
      req.user.id,
    );
    return { success: result, message: 'Вишлист успешно удален' };
  }
}
