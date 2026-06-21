// backend/src/ingredient-categories/ingredient-categories.module.ts

import { Module } from '@nestjs/common';
import { IngredientCategoriesService } from './ingredient-categories.service';
import { IngredientCategoriesController } from './ingredient-categories.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [IngredientCategoriesController],
  providers: [IngredientCategoriesService],
})
export class IngredientCategoriesModule {}
