import { IsString, Length, IsUrl, IsNumber, IsOptional } from 'class-validator';

export class CreateWishlistDto {
  @IsString()
  @Length(1, 250)
  name: string;

  @IsString()
  @Length(1, 1500)
  description: string;

  @IsUrl()
  image: string;

  @IsNumber()
  @IsOptional()
  userId?: number;
}
