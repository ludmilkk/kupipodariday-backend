import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { verifyPassword } from '../common/helpers/hash';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  auth(user: User) {
    const payload = { sub: user.id };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '14d' }),
    };
  }

  async validatePassword(username: string, pass: string) {
    const user = await this.usersService.findByUsername(username, true);
    if (!user) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const matches = await verifyPassword(pass, user.password);
    if (!matches) {
      throw new UnauthorizedException('Некорректная пара логин и пароль');
    }

    return user;
  }
}
