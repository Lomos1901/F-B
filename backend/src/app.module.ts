import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IngredientsModule } from './ingredients/ingredients.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { RecipesModule } from './recipes/recipes.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { IngredientCategoriesModule } from './ingredient-categories/ingredient-categories.module';
import { InventoryReceiptsModule } from './inventory-receipts/inventory-receipts.module'; // THÊM MODULE MỚI

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    IngredientsModule,
    AuthModule,
    OrdersModule,
    RecipesModule,
    CategoriesModule,
    ProductsModule,
    IngredientCategoriesModule,
    InventoryReceiptsModule, // THÊM MODULE MỚI VÀO ĐÂY
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
