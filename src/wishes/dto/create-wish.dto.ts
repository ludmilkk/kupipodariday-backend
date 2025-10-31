import { IsString, Length, IsNumber, IsUrl, Min, Max } from 'class-validator';

export class CreateWishDto {
  @IsString()
  @Length(1, 250)
  name: string;

  @IsString()
  @Length(1, 1024)
  description: string;

  @IsUrl()
  link: string;

  @IsUrl()
  image: string;

  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  price: number;
}
