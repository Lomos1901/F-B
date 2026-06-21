// backend/src/inventory-receipts/inventory-receipts.module.ts

import { Module } from '@nestjs/common';
import { InventoryReceiptsService } from './inventory-receipts.service';
import { InventoryReceiptsController } from './inventory-receipts.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [InventoryReceiptsController],
  providers: [InventoryReceiptsService],
})
export class InventoryReceiptsModule {}
