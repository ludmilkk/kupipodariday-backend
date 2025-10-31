import { join } from 'path';

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    type: process.env.DATABASE_TYPE || 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
    username: 'student',
    password: 'student',
    database: 'kupipodariday',
    entities: [join(__dirname, '/../**/*.entity.{js,ts}')],
    synchronize: true,
  },
  jwt: {
    key: process.env.JWT_KEY || 'jwt_secret',
    expiresIn: '14d',
  },
});
