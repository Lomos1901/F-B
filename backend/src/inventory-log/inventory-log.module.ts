import { Module } from '@nestjs/common';
import { InventoryLogController } from './inventory-log.controller';
import { InventoryLogService } from './inventory-log.service';
import { SupabaseService } from '../supabase/supabase.service'; // Chỉnh lại đường dẫn nếu
// cần
@Module({
  controllers: [InventoryLogController],
  providers: [InventoryLogService, SupabaseService], // Đảm bảo SupabaseService được cung cấp
})
export class InventoryLogModule {}
