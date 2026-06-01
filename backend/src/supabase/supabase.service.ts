import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common'; // Thêm Logger
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly supabaseAdmin: SupabaseClient;
  private readonly supabasePublic: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.logger.log('Bắt đầu khởi tạo SupabaseService...');

    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceKey = this.configService.get<string>('SUPABASE_KEY');
    const anonKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    // In ra các giá trị để debug
    this.logger.debug(`SUPABASE_URL: ${url}`);
    this.logger.debug(`SUPABASE_ANON_KEY: ${anonKey ? '***Đã có***' : '!!!THIẾU!!!'}`);
    this.logger.debug(`SUPABASE_KEY (Service Role): ${serviceKey ? '***Đã có***' : '!!!THIẾU!!!'}`);

    if (!url || !serviceKey || !anonKey) {
      this.logger.error('KHỞI TẠO THẤT BẠI: Một hoặc nhiều biến môi trường Supabase bị thiếu.');
      throw new InternalServerErrorException('Thiếu cấu hình Supabase URL/KEY/ANON_KEY');
    }

    this.supabaseAdmin = createClient(url, serviceKey, { auth: { persistSession: false } });
    this.supabasePublic = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });

    this.logger.log('Khởi tạo SupabaseService thành công!');
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin;
  }

  getPublicClient(): SupabaseClient {
    return this.supabasePublic;
  }
}
