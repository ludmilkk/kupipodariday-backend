import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [SearchController],
})
export class SearchModule {}
