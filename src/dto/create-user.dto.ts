import { IsEmail, IsString, Length, IsOptional, IsUrl } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(2, 30)
  username: string;

  @IsString()
  @Length(2, 200)
  @IsOptional()
  about?: string;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 50)
  password: string;
}
