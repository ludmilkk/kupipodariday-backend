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
import { OffersService } from './offers.service';
import { Offer } from '../entities/offer.entity';
import { CreateOfferDto } from '../dto/create-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createOfferDto: CreateOfferDto, @Request() req) {
    createOfferDto.userId = req.user.id;
    return this.offersService.create(createOfferDto);
  }

  @Get()
  findAll(@Query() query: any) {
    const findOptions: any = {};

    if (query.where) {
      try {
        findOptions.where = JSON.parse(query.where);
      } catch (e) {
        if (query.userId) findOptions.where = { user: { id: query.userId } };
        if (query.itemId)
          findOptions.where = {
            ...findOptions.where,
            item: { id: query.itemId },
          };
      }
    }

    if (query.relations) {
      findOptions.relations = query.relations.split(',');
    }

    if (query.take) findOptions.take = parseInt(query.take);
    if (query.skip) findOptions.skip = parseInt(query.skip);

    return this.offersService.findMany(findOptions);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offersService.findById(+id);
  }

  @Get('wish/:wishId')
  findByWish(@Param('wishId') wishId: string) {
    return this.offersService.findByWish(+wishId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.offersService.findByUser(+userId);
  }

  @Get('details/all')
  findOffersWithDetails() {
    return this.offersService.findOffersWithDetails();
  }

  @Get('details/:id')
  findOfferWithFullDetails(@Param('id') id: string) {
    return this.offersService.findOfferWithFullDetails(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOfferDto: Partial<Offer>,
    @Request() req,
  ) {
    return this.offersService.updateOfferSafely(
      +id,
      req.user.id,
      updateOfferDto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.offersService.deleteOfferSafely(+id, req.user.id);
    return { success: result, message: 'Предложение успешно удалено' };
  }
}
