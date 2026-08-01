import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { DashboardModule } from '../dashboard/dashboard.module';

@Module({
  imports: [SupabaseModule, AnalyticsModule, DashboardModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
