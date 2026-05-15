import { Injectable } from '@nestjs/common';
import { SupabaseService } from './supabase/supabase.service';

@Injectable()
export class AppService {
  constructor(private supabaseService: SupabaseService) {}

  async getHello() {
  try {
    const client = this.supabaseService.getClient();
    const { data, error } = await client.from('ingredients').select('*');
    
    if (error) throw error;
    
    return {
      status: "Thành công",
      message: "Đã lấy được dữ liệu từ quán Sẫm Coffee",
      record_count: data.length,
      data: data
    };
  } catch (err) {
    return {
      status: "Thất bại",
      error_detail: err.message
    };
  }
}
}