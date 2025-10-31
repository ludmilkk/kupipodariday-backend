import { Module } from '@nestjs/common';
import { ProfilesController } from './profiles.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [ProfilesController],
})
export class ProfilesModule {}
