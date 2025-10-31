import {
  Controller,
  Get,
  Patch,
  UseGuards,
  Request,
  Param,
  Body,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HashService } from '../auth/hash.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashService: HashService,
  ) {}

  // Получить свой профиль
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Request() req) {
    const user = await this.usersService.findById(req.user.id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getProfile(@Param('id') id: string) {
    const userId = parseInt(id);
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMyProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = req.user.id;

    const existingUser = await this.usersService.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (
      updateProfileDto.email &&
      updateProfileDto.email !== existingUser.email
    ) {
      const userWithEmail = await this.usersService.findByEmail(
        updateProfileDto.email,
      );
      if (userWithEmail) {
        throw new ForbiddenException(
          'Пользователь с таким email уже существует',
        );
      }
    }

    if (
      updateProfileDto.username &&
      updateProfileDto.username !== existingUser.username
    ) {
      const userWithUsername = await this.usersService.findOne({
        where: { username: updateProfileDto.username },
      });
      if (userWithUsername) {
        throw new ForbiddenException(
          'Пользователь с таким именем уже существует',
        );
      }
    }

    if (updateProfileDto.password) {
      updateProfileDto.password = await this.hashService.hashPassword(
        updateProfileDto.password,
      );
    }

    const updatedUser = await this.usersService.update(
      userId,
      updateProfileDto,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/wishlists')
  async getMyWishlists(@Request() req) {
    const user = await this.usersService.findUserWithWishlists(req.user.id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/offers')
  async getMyOffers(@Request() req) {
    const user = await this.usersService.findUserWithOffers(req.user.id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/wishes')
  async getMyWishes(@Request() req) {
    const user = await this.usersService.findUserWithWishes(req.user.id);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/wishlists')
  async getUserWishlists(@Param('id') id: string) {
    const userId = parseInt(id);
    const user = await this.usersService.findUserWithWishlists(userId);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/wishes')
  async getUserWishes(@Param('id') id: string) {
    const userId = parseInt(id);
    const user = await this.usersService.findUserWithWishes(userId);

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
