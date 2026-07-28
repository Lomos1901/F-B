import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ShiftsModule } from '../shifts/shifts.module';

@Module({
  imports: [SupabaseModule, forwardRef(() => ShiftsModule)],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService], // Xuất OrdersService để PaymentsService dùng
})
export class OrdersModule {}
