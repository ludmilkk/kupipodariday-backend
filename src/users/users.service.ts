import {
  ConflictException,
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Like,
  QueryFailedError,
} from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { createHashPass } from '../common/helpers/hash';
import { Wish } from '../wishes/entities/wish.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPass = await createHashPass(createUserDto.password);
    let newUser: User;
    try {
      newUser = await this.userRepository.save({
        ...createUserDto,
        password: hashedPass,
      });
    } catch (err) {
      if (err instanceof QueryFailedError) {
        const newErr = err.driverError;
        if (newErr.code === '23505') {
          throw new ConflictException(
            'Пользователь с таким email или username уже зарегистрирован',
          );
        }
      }
    }
    return this.findById(newUser.id, true);
  }

  async findMany(query: string) {
    return this.userRepository
      .createQueryBuilder('user')
      .where(
        'LOWER(user.username) LIKE LOWER(:query) OR (user.email) LIKE LOWER(:query)',
        { query: `%${query}%` },
      )
      .addSelect('user.email')
      .getMany();
  }

  async findOne(query: FindOneOptions<User>): Promise<User | null> {
    const defaultOptions: FindOneOptions<User> = {
      relations: ['wishlists', 'offers', 'wishes'],
      ...query,
    };
    return this.userRepository.findOne(defaultOptions);
  }

  async updateOne(
    query: FindOneOptions<User>,
    updateData: Partial<User>,
  ): Promise<User | null> {
    const user = await this.findOne(query);
    if (!user) return null;

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async removeOne(query: FindOneOptions<User>): Promise<boolean> {
    const user = await this.findOne(query);
    if (!user) return false;

    await this.userRepository.remove(user);
    return true;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findById(id: number, withEmail = false) {
    let query = this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id });
    if (withEmail) {
      query = query.addSelect('user.email');
    }
    const user = await query.getOne();

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async findByUsername(username: string, withPassword = false) {
    let query = this.userRepository
      .createQueryBuilder('user')
      .where('LOWER(user.username) LIKE LOWER(:username)', { username })
      .addSelect('user.email');
    if (withPassword) {
      query = query.addSelect('user.password');
    }

    const user = await query.getOne();
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await createHashPass(updateUserDto.password);
    }

    try {
      await this.userRepository.update(id, updateUserDto);
    } catch (err) {
      if (err instanceof QueryFailedError) {
        const newErr = err.driverError;
        if (newErr.code === '23505') {
          throw new ConflictException(
            'Пользователь с таким email или username уже зарегистрирован',
          );
        }
      }
    }
    return this.findById(id, true);
  }

  async getUserWishes(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['wishes', 'wishes.owner', 'wishes.offers'],
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user.wishes;
  }

  async getWishesByUsername(username: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.wishes', 'wishes')
      .leftJoinAndSelect('wishes.offers', 'offers')
      .where('LOWER(user.username) LIKE LOWER(:username)', { username })
      .addSelect('user.email')
      .getOne();

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user.wishes;
  }

  async findUserWithWishlists(id: number): Promise<User | null> {
    return this.findOne({
      where: { id },
      relations: ['wishlists', 'wishlists.items'],
    });
  }

  async findUserWithOffers(id: number): Promise<User | null> {
    return this.findOne({
      where: { id },
      relations: ['offers', 'offers.item'],
    });
  }

  async findUserWithWishes(id: number): Promise<User | null> {
    return this.findOne({
      where: { id },
      relations: ['wishes', 'wishes.wishlist'],
    });
  }

  async searchUsers(searchQuery: string): Promise<User[]> {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return this.userRepository.find();
    }

    return this.userRepository.find({
      where: [{ username: Like(`%${query}%`) }, { email: Like(`%${query}%`) }],
      relations: ['wishlists', 'offers', 'wishes'],
    });
  }

  async searchUsersByUsername(username: string): Promise<User[]> {
    if (!username.trim()) {
      return this.userRepository.find();
    }

    return this.userRepository.find({
      where: { username: Like(`%${username}%`) },
      relations: ['wishlists', 'offers', 'wishes'],
    });
  }

  async searchUsersByEmail(email: string): Promise<User[]> {
    if (!email.trim()) {
      return this.userRepository.find();
    }

    return this.userRepository.find({
      where: { email: Like(`%${email}%`) },
      relations: ['wishlists', 'offers', 'wishes'],
    });
  }

  async searchUsersAdvanced(criteria: {
    query?: string;
    username?: string;
    email?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }> {
    const { query, username, email, limit = 10, offset = 0 } = criteria;

    let whereConditions: FindOptionsWhere<User>[] = [];

    if (query && query.trim()) {
      const searchQuery = query.toLowerCase().trim();
      whereConditions.push(
        { username: Like(`%${searchQuery}%`) },
        { email: Like(`%${searchQuery}%`) },
      );
    } else {
      if (username && username.trim()) {
        whereConditions.push({ username: Like(`%${username}%`) });
      }
      if (email && email.trim()) {
        whereConditions.push({ email: Like(`%${email}%`) });
      }
    }

    if (whereConditions.length === 0) {
      whereConditions = [{}];
    }

    const [users, total] = await this.userRepository.findAndCount({
      where: whereConditions,
      relations: ['wishlists', 'offers', 'wishes'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  async canUpdateUser(
    targetUserId: number,
    currentUserId: number,
  ): Promise<boolean> {
    if (targetUserId !== currentUserId) {
      throw new ForbiddenException('Вы можете изменять только свой профиль');
    }

    const user = await this.findById(targetUserId);
    if (!user) {
      throw new NotFoundException(
        `Пользователь с ID ${targetUserId} не найден`,
      );
    }

    return true;
  }

  async canDeleteUser(
    targetUserId: number,
    currentUserId: number,
  ): Promise<boolean> {
    if (targetUserId !== currentUserId) {
      throw new ForbiddenException('Вы можете удалять только свой профиль');
    }

    const user = await this.findById(targetUserId);
    if (!user) {
      throw new NotFoundException(
        `Пользователь с ID ${targetUserId} не найден`,
      );
    }

    return true;
  }

  async updateUserSafely(
    userId: number,
    currentUserId: number,
    updateData: Partial<User>,
  ): Promise<User> {
    await this.canUpdateUser(userId, currentUserId);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, password, wishlists, offers, wishes, ...safeUpdateData } =
      updateData;

    const updatedUser = await this.update(userId, safeUpdateData);

    if (!updatedUser) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    return updatedUser;
  }

  async deleteUserSafely(
    userId: number,
    currentUserId: number,
  ): Promise<boolean> {
    await this.canDeleteUser(userId, currentUserId);

    const result = await this.removeOne({ where: { id: userId } });

    if (!result) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    return result;
  }

  parseQueryParams(
    query: Record<string, string | undefined>,
  ): FindManyOptions<User> {
    const findOptions: Partial<FindManyOptions<User>> = {};

    if (query.where) {
      try {
        findOptions.where = JSON.parse(query.where);
      } catch (e) {
        if (query.email) findOptions.where = { email: query.email };
        if (query.username) {
          findOptions.where = {
            ...findOptions.where,
            username: query.username,
          };
        }
      }
    }

    if (query.relations) {
      findOptions.relations = query.relations.split(',');
    }

    if (query.take) findOptions.take = parseInt(query.take);
    if (query.skip) findOptions.skip = parseInt(query.skip);

    return findOptions;
  }

  getUserWithoutPassword(user: User | null): Omit<User, 'password'> {
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  getUserPublic(user: User | null): Omit<User, 'password' | 'email'> {
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, email, ...userPublic } = user;
    return userPublic;
  }

  async findOwnUser(userId: number): Promise<Omit<User, 'password'>> {
    const user = await this.findById(userId);
    return this.getUserWithoutPassword(user);
  }

  async deleteUserWithResponse(
    userId: number,
    currentUserId: number,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.deleteUserSafely(userId, currentUserId);
    return { success: result, message: 'Профиль успешно удален' };
  }

  async searchUsersFromDto(searchDto: {
    query?: string;
    username?: string;
    email?: string;
  }): Promise<User[] | { users: User[]; total: number }> {
    const { query, username, email } = searchDto;

    if (query) {
      return this.searchUsers(query);
    }

    if (username || email) {
      const criteria: { username?: string; email?: string } = {};
      if (username) criteria.username = username;
      if (email) criteria.email = email;

      return this.searchUsersAdvanced(criteria);
    }

    return this.findAll();
  }

  async updateUser(
    userId: number,
    updateUserDto: {
      username?: string;
      about?: string;
      avatar?: string;
      email?: string;
      password?: string;
    },
  ): Promise<Omit<User, 'password'>> {
    const existingUser = await this.findById(userId);
    if (!existingUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const userWithEmail = await this.findByEmail(updateUserDto.email);
      if (userWithEmail) {
        throw new ForbiddenException(
          'Пользователь с таким email уже существует',
        );
      }
    }

    if (
      updateUserDto.username &&
      updateUserDto.username !== existingUser.username
    ) {
      const userWithUsername = await this.findOne({
        where: { username: updateUserDto.username },
      });
      if (userWithUsername) {
        throw new ForbiddenException(
          'Пользователь с таким именем уже существует',
        );
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await createHashPass(updateUserDto.password);
    }

    const updatedUser = await this.update(userId, updateUserDto);

    return this.getUserWithoutPassword(updatedUser);
  }

  async findUsersByQuery(query: string): Promise<Omit<User, 'password'>[]> {
    const users = await this.searchUsers(query);
    return users.map((user) => this.getUserWithoutPassword(user));
  }

  async findUserPublicByUsername(
    username: string,
  ): Promise<Omit<User, 'password' | 'email'>> {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return this.getUserPublic(user);
  }

  async findUserWishesByUsername(username: string): Promise<Wish[]> {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.wishes', 'wish')
      .leftJoinAndSelect('wish.offers', 'offer')
      .where('user.id = :userId', { userId: user.id })
      .getOne()
      .then((userWithWishes) => userWithWishes?.wishes || []);
  }

  async findOwnWishes(userId: number): Promise<Wish[]> {
    const userWithWishes = await this.findUserWithWishes(userId);
    return userWithWishes?.wishes || [];
  }

  async updateOwnUser(
    userId: number,
    updateUserDto: {
      username?: string;
      about?: string;
      avatar?: string;
      email?: string;
      password?: string;
    },
  ): Promise<Omit<User, 'password'>> {
    return this.updateUser(userId, updateUserDto);
  }
}
