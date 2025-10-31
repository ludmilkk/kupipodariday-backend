import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  Post,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt.guard';
import getUserFromReq from '../common/helpers/current-user.helper';
import { FindUserDto } from './dto/find-users.dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getCurrentUser(@Req() req) {
    const id = getUserFromReq(req)?.id;
    return this.usersService.findById(id, true);
  }

  @Patch('me')
  updateCurrentUser(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    const id = getUserFromReq(req)?.id;
    return this.usersService.update(id, updateUserDto);
  }

  @Get('me/wishes')
  getWishes(@Req() req) {
    const id = getUserFromReq(req)?.id;
    return this.usersService.getUserWishes(id);
  }

  @Get(':username')
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Get(':username/wishes')
  findWishesByUsername(@Param('username') username: string) {
    return this.usersService.getWishesByUsername(username);
  }

  @Post('find')
  findMany(@Body() findUserDto: FindUserDto) {
    return this.usersService.findMany(findUserDto.query.toLowerCase());
  }
}
