import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SupabaseModule } from '../supabase/supabase.module'; // Đảm bảo đường dẫn này đúng

@Module({
  imports: [SupabaseModule], // 🌟 Bắt buộc phải có SupabaseModule ở đây
  providers: [ProductsService],
  controllers: [ProductsController]
})
export class ProductsModule {}