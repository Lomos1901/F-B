import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

constructor(private configService: ConfigService) {
  // Thêm dấu ! phía sau get<string>(...) để báo với TS là "Yên tâm, tôi đã điền rồi"
  const url = this.configService.get<string>('SUPABASE_URL')!;
  const key = this.configService.get<string>('SUPABASE_KEY')!;
  this.supabase = createClient(url, key);
}

  getClient() {
    return this.supabase;   
  }
}