import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module'; // Import cái mới tạo
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IngredientsModule } from './ingredients/ingredients.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { RecipesModule } from './recipes/recipes.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { InventoryLogModule } from './inventory-log/inventory-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Giúp ConfigService có sẵn cho toàn bộ app
    SupabaseModule,
    IngredientsModule,
    AuthModule,
    OrdersModule,
    RecipesModule,
    CategoriesModule,
    ProductsModule,
    InventoryLogModule, // Đưa Module kết nối vào đây
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
