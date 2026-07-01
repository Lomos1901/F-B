import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DashboardService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  /**
   * NÂNG CẤP: Chỉ cần gọi một hàm RPC duy nhất để lấy toàn bộ dữ liệu.
   * @param days Số ngày để lấy dữ liệu cho biểu đồ và top sản phẩm.
   * @returns Một đối tượng JSON chứa tất cả dữ liệu dashboard.
   */
  async getDashboardData(days: number) {
    this.logger.log(`Calling RPC 'get_dashboard_data' with p_days = ${days}`);

    const { data, error } = await this.client.rpc('get_dashboard_data', {
      p_days: days,
    });

    if (error) {
      this.logger.error("Lỗi khi thực thi RPC 'get_dashboard_data':", error);
      throw new InternalServerErrorException('Không thể lấy dữ liệu dashboard từ CSDL.');
    }

    // Dữ liệu trả về từ RPC đã là một đối tượng JSON hoàn chỉnh.
    return data;
  }
}