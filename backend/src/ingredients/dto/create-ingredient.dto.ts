// backend/src/ingredients/dto/create-ingredient.dto.ts

import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  name: string;

  @IsString()
  base_unit: string;

  @IsString()
  recipe_unit: string;

  @IsNumber()
  @IsPositive()
  conversion_factor: number;

  @IsNumber()
  @IsPositive()
  cost_per_unit: number;

  /**
   * Tái cấu trúc: Thêm category_id vào DTO.
   * @IsUUID() - Phải là một chuỗi UUID hợp lệ.
   * @IsOptional() - Trường này không bắt buộc phải có.
   */
  @IsUUID('4', { message: 'ID danh mục không hợp lệ.' })
  @IsOptional()
  category_id?: string;
}
