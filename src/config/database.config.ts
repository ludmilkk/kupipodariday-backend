import { User } from '../entities/user.entity';
import { Wish } from '../entities/wish.entity';
import { Wishlist } from '../entities/wishlist.entity';
import { Offer } from '../entities/offer.entity';

export const databaseConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'student',
  password: process.env.DB_PASSWORD || 'student',
  database: process.env.DB_NAME || 'kupipodariday',
  entities: [User, Wish, Wishlist, Offer],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  migrations: ['dist/migrations/*.js'],
  migrationsRun: false,
  ssl: false,
  extra: {
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
};
