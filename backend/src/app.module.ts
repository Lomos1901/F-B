import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IngredientsModule } from './ingredients/ingredients.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { IngredientCategoriesModule } from './ingredient-categories/ingredient-categories.module';
import { InventoryReceiptsModule } from './inventory-receipts/inventory-receipts.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module'; // Import AnalyticsModule
import { PaymentsModule } from './payments/payments.module';
import { ShiftsModule } from './shifts/shifts.module';
import { TablesModule } from './tables/tables.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SupabaseModule,
    IngredientsModule,
    AuthModule,
    OrdersModule,
    CategoriesModule,
    ProductsModule,
    IngredientCategoriesModule,
    InventoryReceiptsModule,
    UsersModule,
    DashboardModule,
    AnalyticsModule,
    PaymentsModule,
    ShiftsModule, // Thêm AnalyticsModule vào đây
    TablesModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
