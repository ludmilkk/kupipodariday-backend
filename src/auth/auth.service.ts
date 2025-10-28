import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { HashService } from './hash.service';
import { SignupDto } from './dto/signup.dto';
import { SigninDto } from './dto/signin.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private hashService: HashService,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, username, avatar, about } = signupDto;

    const existingUserByEmail = await this.usersService.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const existingUserByUsername = await this.usersService.findOne({
      where: { username },
    });
    if (existingUserByUsername) {
      throw new ConflictException('Пользователь с таким именем уже существует');
    }

    const hashedPassword = await this.hashService.hashPassword(password);

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      username,
      avatar: avatar || 'https://i.pravatar.cc/300',
      about: about || 'Пока ничего не рассказал о себе',
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    const payload = {
      email: user.email,
      sub: user.id,
      username: user.username,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async signin(signinDto: SigninDto) {
    const { email, password } = signinDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const isPasswordValid = await this.hashService.comparePassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    const payload = {
      email: user.email,
      sub: user.id,
      username: user.username,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      (await this.hashService.comparePassword(password, user.password))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }
}
