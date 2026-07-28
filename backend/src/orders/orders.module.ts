import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService], // Xuất OrdersService để PaymentsService dùng
})
export class OrdersModule {}
