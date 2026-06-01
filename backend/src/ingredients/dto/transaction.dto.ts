// src/ingredients/dto/transaction.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class ImportStockDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  note: string;

  @IsString()
  @IsOptional()
  performed_by?: string;
}

export class StocktakeDto {
  @IsNumber()
  actual_quantity: number;

  @IsString()
  @IsNotEmpty()
  note: string;

  @IsString()
  @IsOptional()
  performed_by?: string;
}
