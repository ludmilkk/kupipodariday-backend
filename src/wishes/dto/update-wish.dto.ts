import {
  IsString,
  IsNumber,
  IsUrl,
  IsOptional,
  Length,
  Min,
} from 'class-validator';

export class UpdateWishDto {
  @IsString()
  @Length(1, 250)
  @IsOptional()
  name?: string;

  @IsString()
  @Length(1, 1024)
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  link?: string;

  @IsUrl()
  @IsOptional()
  image?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  price?: number;
}
