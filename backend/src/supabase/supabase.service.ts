import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly supabaseAdmin: any;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_KEY'); // Service Role Key

    if (!url || !key) {
      throw new InternalServerErrorException('Thiếu cấu hình Supabase URL/KEY');
    }

    // 1. Admin Client: Dùng cho cronjob, webhook, bỏ qua RLS
    this.supabaseAdmin = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  getAdminClient(): any {
    return this.supabaseAdmin;
  }

  // 2. Auth Client: BẮT BUỘC dùng cho các API thông thường để tuân thủ RLS
  getClient(jwtToken: string): any {
    const url = this.configService.get<string>('SUPABASE_URL')!;
    const key = this.configService.get<string>('SUPABASE_KEY')!; // Ở môi trường production nên dùng ANON_KEY

    return createClient(url, key, {
      auth: { persistSession: false },
      global: {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    });
  }
}
