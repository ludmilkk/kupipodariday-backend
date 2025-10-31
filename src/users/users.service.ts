import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, FindOneOptions, Like } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // CRUD методы с query-фильтрами
  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async findMany(query: FindManyOptions<User> = {}): Promise<User[]> {
    const defaultOptions: FindManyOptions<User> = {
      relations: ['wishlists', 'offers', 'wishes'],
      ...query,
    };
    return this.usersRepository.find(defaultOptions);
  }

  async findOne(query: FindOneOptions<User>): Promise<User | null> {
    const defaultOptions: FindOneOptions<User> = {
      relations: ['wishlists', 'offers', 'wishes'],
      ...query,
    };
    return this.usersRepository.findOne(defaultOptions);
  }

  async updateOne(
    query: FindOneOptions<User>,
    updateData: Partial<User>,
  ): Promise<User | null> {
    const user = await this.findOne(query);
    if (!user) return null;

    Object.assign(user, updateData);
    return this.usersRepository.save(user);
  }

  async removeOne(query: FindOneOptions<User>): Promise<boolean> {
    const user = await this.findOne(query);
    if (!user) return false;

    await this.usersRepository.remove(user);
    return true;
  }

  // Специализированные методы для обратной совместимости
  async findAll(): Promise<User[]> {
    return this.findMany();
  }

  async findById(id: number): Promise<User | null> {
    return this.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ where: { email } });
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    return this.updateOne({ where: { id } }, userData);
  }

  async remove(id: number): Promise<boolean> {
    return this.removeOne({ where: { id } });
  }

  // Методы для работы со связанными данными
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

  // Методы поиска пользователей
  async searchUsers(searchQuery: string): Promise<User[]> {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      return this.findMany();
    }

    return this.findMany({
      where: [{ username: Like(`%${query}%`) }, { email: Like(`%${query}%`) }],
      relations: ['wishlists', 'offers', 'wishes'],
    });
  }

  async searchUsersByUsername(username: string): Promise<User[]> {
    if (!username.trim()) {
      return this.findMany();
    }

    return this.findMany({
      where: { username: Like(`%${username}%`) },
      relations: ['wishlists', 'offers', 'wishes'],
    });
  }

  async searchUsersByEmail(email: string): Promise<User[]> {
    if (!email.trim()) {
      return this.findMany();
    }

    return this.findMany({
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

    let whereConditions: any[] = [];

    // Если есть общий поисковый запрос
    if (query && query.trim()) {
      const searchQuery = query.toLowerCase().trim();
      whereConditions.push(
        { username: Like(`%${searchQuery}%`) },
        { email: Like(`%${searchQuery}%`) },
      );
    } else {
      // Если есть конкретные критерии
      if (username && username.trim()) {
        whereConditions.push({ username: Like(`%${username}%`) });
      }
      if (email && email.trim()) {
        whereConditions.push({ email: Like(`%${email}%`) });
      }
    }

    // Если нет условий поиска, возвращаем всех пользователей
    if (whereConditions.length === 0) {
      whereConditions = [{}];
    }

    const [users, total] = await this.usersRepository.findAndCount({
      where: whereConditions,
      relations: ['wishlists', 'offers', 'wishes'],
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    return { users, total };
  }

  // Методы проверки прав доступа
  /**
   * Проверяет, может ли пользователь обновить профиль
   * @param targetUserId - ID пользователя, профиль которого обновляется
   * @param currentUserId - ID текущего пользователя
   * @returns true если может, иначе выбрасывает исключение
   */
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

  /**
   * Проверяет, может ли пользователь удалить профиль
   * @param targetUserId - ID пользователя, который удаляется
   * @param currentUserId - ID текущего пользователя
   * @returns true если может, иначе выбрасывает исключение
   */
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

  /**
   * Безопасное обновление пользователя с проверкой прав
   * @param userId - ID пользователя
   * @param currentUserId - ID текущего пользователя
   * @param updateData - данные для обновления
   * @returns обновленный пользователь
   */
  async updateUserSafely(
    userId: number,
    currentUserId: number,
    updateData: Partial<User>,
  ): Promise<User> {
    // Проверяем права на обновление
    await this.canUpdateUser(userId, currentUserId);

    // Запрещаем изменение чувствительных полей
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, password, wishlists, offers, wishes, ...safeUpdateData } =
      updateData;

    // Выполняем базовое обновление
    const updatedUser = await this.update(userId, safeUpdateData);

    if (!updatedUser) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    return updatedUser;
  }

  /**
   * Безопасное удаление пользователя с проверкой прав
   * @param userId - ID пользователя
   * @param currentUserId - ID текущего пользователя
   * @returns true если удалено успешно
   */
  async deleteUserSafely(
    userId: number,
    currentUserId: number,
  ): Promise<boolean> {
    // Проверяем права на удаление
    await this.canDeleteUser(userId, currentUserId);

    // Выполняем базовое удаление
    const result = await this.remove(userId);

    if (!result) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    return result;
  }
}
