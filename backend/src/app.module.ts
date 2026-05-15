import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module'; // Import cái mới tạo
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Giúp ConfigService có sẵn cho toàn bộ app
    SupabaseModule, // Đưa Module kết nối vào đây
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}