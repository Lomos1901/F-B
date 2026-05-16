import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { SupabaseModule } from '../supabase/supabase.module'; // Thêm dòng này

@Module({
  imports: [SupabaseModule], // Kích hoạt Supabase cho Module
  providers: [CategoriesService],
  controllers: [CategoriesController]
})
export class CategoriesModule {}