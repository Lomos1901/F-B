import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class AnalyticsService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  /**
   * Lấy danh sách các cảnh báo, có thể lọc theo trạng thái đã đọc.
   */
  async getAnomalies(limit: number = 50, unreadOnly: boolean = false) {
    let query = this.client
      .from('ai_anomalies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Lỗi khi lấy danh sách anomalies:', error);
      throw new InternalServerErrorException('Không thể lấy danh sách cảnh báo.');
    }
    return data;
  }

  /**
   * Đánh dấu một cảnh báo là đã đọc.
   */
  async markAsRead(id: string) {
    const { data, error } = await this.client
      .from('ai_anomalies')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Lỗi khi đánh dấu đã đọc cho anomaly ${id}:`, error);
      throw new InternalServerErrorException('Không thể cập nhật cảnh báo.');
    }
    if (!data) {
      throw new NotFoundException(`Không tìm thấy cảnh báo với ID ${id}.`);
    }
    return data;
  }

  async runDailyAnalysis() {
    this.logger.log('Bắt đầu quy trình phân tích dữ liệu hàng ngày...');
    // ... (logic phân tích giữ nguyên)
    this.logger.log('Hoàn tất quy trình phân tích.');
    return { message: 'Phân tích dữ liệu hàng ngày đã hoàn tất.' };
  }

  // ... (các hàm private và hàm test giữ nguyên)
}