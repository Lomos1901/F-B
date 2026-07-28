import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  // API POST: http://localhost:3001/recipes (Lưu công thức mới)
  @Post()
  async saveRecipe(
    @Body('product_id') productId: string,
    @Body('ingredients')
    ingredients: { ingredient_id: string; quantity_required: number }[],
  ) {
    return this.recipesService.createRecipe(productId, ingredients);
  }

  // API GET: http://localhost:3001/recipes/:productId (Xem công thức của món)
  @Get(':productId')
  async getByProduct(@Param('productId') productId: string) {
    return this.recipesService.getRecipeByProduct(productId);
  }
}
