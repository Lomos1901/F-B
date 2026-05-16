import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SupabaseModule } from '../supabase/supabase.module'; // <-- Nhớ import Module quản lý Supabase của Duy vào đây

@Module({
  imports: [SupabaseModule], // <-- Đưa vào mảng imports để AuthService sử dụng được getClient()
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
