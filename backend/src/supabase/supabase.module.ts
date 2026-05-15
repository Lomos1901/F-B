import { Module, Global } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Global() // Thêm cái này để dùng SupabaseService ở mọi nơi mà không cần import lại
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService], // Bắt buộc phải có dòng này để Export Service ra ngoài
})
export class SupabaseModule {}