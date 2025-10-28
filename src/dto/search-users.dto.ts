import { IsString, IsOptional, Length } from 'class-validator';

export class SearchUsersDto {
  @IsString()
  @Length(1, 100)
  @IsOptional()
  query?: string;

  @IsString()
  @Length(1, 100)
  @IsOptional()
  username?: string;

  @IsString()
  @Length(1, 100)
  @IsOptional()
  email?: string;
}
