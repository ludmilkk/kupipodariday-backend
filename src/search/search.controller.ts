import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchUsersDto } from '../dto/search-users.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async searchUsers(@Query() searchDto: SearchUsersDto) {
    const { query, username, email } = searchDto;

    if (query) {
      return this.usersService.searchUsers(query);
    }

    if (username || email) {
      const criteria: any = {};
      if (username) criteria.username = username;
      if (email) criteria.email = email;

      return this.usersService.searchUsersAdvanced(criteria);
    }

    return this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/username')
  async searchUsersByUsername(@Query('q') username: string) {
    return this.usersService.searchUsersByUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/email')
  async searchUsersByEmail(@Query('q') email: string) {
    return this.usersService.searchUsersByEmail(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get('users/advanced')
  async searchUsersAdvanced(
    @Query('q') query?: string,
    @Query('username') username?: string,
    @Query('email') email?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    return this.usersService.searchUsersAdvanced({
      query,
      username,
      email,
      limit,
      offset,
    });
  }
}
