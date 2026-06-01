// src/ingredients/dto/create-ingredient.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  base_unit: string;

  @IsString()
  @IsNotEmpty()
  recipe_unit: string;

  @IsNumber()
  @Min(0)
  conversion_factor: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  min_threshold?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost_per_unit?: number;
}
