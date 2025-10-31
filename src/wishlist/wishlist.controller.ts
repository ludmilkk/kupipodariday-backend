import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import getUserFromReq from '../common/helpers/current-user.helper';

@UseGuards(JwtAuthGuard)
@Controller('wishlistlists')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  create(@Req() req, @Body() createWishlistDto: CreateWishlistDto) {
    const user = getUserFromReq(req);
    return this.wishlistService.create(user, createWishlistDto);
  }

  @Get()
  findAll() {
    return this.wishlistService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.wishlistService.findById(id);
  }

  @Patch(':wishlistId')
  update(
    @Req() req,
    @Param('wishlistId') wishlistId: number,
    @Body() updateWishlistDto: UpdateWishlistDto,
  ) {
    const userId = getUserFromReq(req)?.id;
    return this.wishlistService.update(wishlistId, userId, updateWishlistDto);
  }

  @Delete(':wishlistId')
  remove(@Req() req, @Param('wishlistId') wishlistId: number) {
    const userId = getUserFromReq(req)?.id;
    return this.wishlistService.remove(wishlistId, userId);
  }
}
