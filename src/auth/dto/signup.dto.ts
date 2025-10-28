import { IsEmail, IsString, Length, IsOptional, IsUrl } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 50)
  password: string;

  @IsString()
  @Length(2, 30)
  username: string;

  @IsUrl()
  @IsOptional()
  avatar?: string;

  @IsString()
  @Length(2, 200)
  @IsOptional()
  about?: string;
}
