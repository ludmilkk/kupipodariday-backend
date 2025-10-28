import { IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class CreateOfferDto {
  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  amount: number;

  @IsBoolean()
  @IsOptional()
  hidden?: boolean;

  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsNumber()
  itemId: number;
}
