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
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: any) {
    const findOptions: any = {};

    if (query.where) {
      try {
        findOptions.where = JSON.parse(query.where);
      } catch (e) {
        if (query.email) findOptions.where = { email: query.email };
        if (query.username)
          findOptions.where = {
            ...findOptions.where,
            username: query.username,
          };
      }
    }

    if (query.relations) {
      findOptions.relations = query.relations.split(',');
    }

    if (query.take) findOptions.take = parseInt(query.take);
    if (query.skip) findOptions.skip = parseInt(query.skip);

    return this.usersService.findMany(findOptions);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/wishlists')
  findUserWithWishlists(@Param('id') id: string) {
    return this.usersService.findUserWithWishlists(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/offers')
  findUserWithOffers(@Param('id') id: string) {
    return this.usersService.findUserWithOffers(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/wishes')
  findUserWithWishes(@Param('id') id: string) {
    return this.usersService.findUserWithWishes(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<User>,
    @Request() req,
  ) {
    return this.usersService.updateUserSafely(+id, req.user.id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const result = await this.usersService.deleteUserSafely(+id, req.user.id);
    return { success: result, message: 'Профиль успешно удален' };
  }
}
