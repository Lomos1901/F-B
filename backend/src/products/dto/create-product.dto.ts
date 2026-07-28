// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class RecipeItemDto {
  @IsUUID()
  ingredient_id: string;

  @IsNumber()
  @Min(0.01)
  quantity_required: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsUUID()
  category_id: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecipeItemDto)
  ingredients: RecipeItemDto[];
}
