import { IsEmail, IsString, Length } from 'class-validator';

export class SigninDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 50)
  password: string;
}
