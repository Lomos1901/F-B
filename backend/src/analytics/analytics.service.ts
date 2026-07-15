import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ProductSalesStat {
  product_id: string;
  mean_daily_sales: number;
  stddev_daily_sales: number;
}

@Injectable()
export class AnalyticsService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  async getTodayDiagnostics() {
    this.logger.log('--- BẮT ĐẦU CHẨN ĐOÁN ---');
    const { data: allProducts, error: productsError } = await this.client.from('products').select('id, name');
    if (productsError) throw new InternalServerErrorException('Không thể lấy danh sách sản phẩm.');
    if (!allProducts) return [];

    const todaySalesQuery = `
      SELECT od.product_id, SUM(od.quantity) as total_quantity
      FROM public.order_detail od
      JOIN public.orders o ON od.order_id = o.id
      JOIN public.order_status os ON o.status_id = os.id
      WHERE os.status_name = 'PAID'
        AND o.updated_at >= date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh')
        AND o.updated_at < (date_trunc('day', now() AT TIME ZONE 'Asia/Ho_Chi_Minh') + interval '1 day')
      GROUP BY od.product_id;
    `;
    const { data: todaySales, error: salesError } = await this.client.query(todaySalesQuery);
    if (salesError) throw new InternalServerErrorException('Không thể lấy doanh số hôm nay.');

    const todaySalesMap = new Map((todaySales || []).map(s => [s.product_id, s.total_quantity]));
    this.logger.log('Dữ liệu bán hôm nay đã tổng hợp:', Object.fromEntries(todaySalesMap));

    const productIds = allProducts.map(p => p.id);
    const { data: allStats, error: statsError } = await this.client.rpc('get_products_sales_stats', {
      p_product_ids: productIds,
      p_days: 30,
    });
    if (statsError) throw new InternalServerErrorException('Không thể lấy dữ liệu thống kê.');

    const statsMap = new Map<string, ProductSalesStat>((allStats || []).map((s: ProductSalesStat) => [s.product_id, s]));

    const diagnostics = allProducts.map(product => {
      const today_quantity = Number(todaySalesMap.get(product.id) || 0);
      const stats = statsMap.get(product.id);

      const mean_daily_sales = stats ? Number(stats.mean_daily_sales) : 0;
      const stddev_daily_sales = stats ? Number(stats.stddev_daily_sales) : 0;
      const threshold = mean_daily_sales + 2 * stddev_daily_sales;

      return {
        product_name: product.name,
        today_quantity: today_quantity,
        mean_daily_sales: parseFloat(mean_daily_sales.toFixed(2)),
        stddev_daily_sales: parseFloat(stddev_daily_sales.toFixed(2)),
        threshold: parseFloat(threshold.toFixed(2)),
        is_anomaly: today_quantity > threshold && today_quantity > 5,
      };
    });

    this.logger.log('--- KẾT THÚC CHẨN ĐOÁN ---');
    return diagnostics;
  }

  async getAnomalies(limit: number = 50, unreadOnly: boolean = false) {
    let query = this.client.from('ai_anomalies').select('*').order('created_at', { ascending: false }).limit(limit);
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    const { data, error } = await query;
    if (error) throw new InternalServerErrorException('Không thể lấy danh sách cảnh báo.');
    return data;
  }

  async markAsRead(id: string) {
    const { data, error } = await this.client.from('ai_anomalies').update({ is_read: true }).eq('id', id).select().single();
    if (error) throw new InternalServerErrorException('Không thể cập nhật cảnh báo.');
    if (!data) throw new NotFoundException(`Không tìm thấy cảnh báo với ID ${id}.`);
    return data;
  }

  async runDailyAnalysis() {
    this.logger.log('Bắt đầu quy trình phân tích dữ liệu hàng ngày...');
    const diagnostics = await this.getTodayDiagnostics();

    for (const item of diagnostics) {
      if (item.is_anomaly) {
        const message = `Doanh số '${item.product_name}' tăng đột biến, đạt ${item.today_quantity} sản phẩm (so với trung bình ${item.mean_daily_sales}).`;
        this.logger.warn(`Phát hiện bất thường: ${message}`);

        const product = (await this.client.from('products').select('id').eq('name', item.product_name).single()).data;
        if (!product) continue;

        const anomalyScore = (item.today_quantity - item.mean_daily_sales) / (item.stddev_daily_sales || 1);

        await this.createAnomalyRecord({
          alert_category: 'SALES_SPIKE',
          entity_type: 'products',
          entity_id: product.id,
          expected_value: item.mean_daily_sales,
          actual_value: item.today_quantity,
          anomaly_score: Math.min(anomalyScore / 5, 1),
          message: message,
          recommended_action: 'Kiểm tra tồn kho các nguyên liệu liên quan.'
        });
      }
    }
    this.logger.log('Hoàn tất quy trình phân tích.');
    return { message: 'Phân tích dữ liệu hàng ngày đã hoàn tất.' };
  }

  private async createAnomalyRecord(payload: any) {
    const { error } = await this.client.from('ai_anomalies').insert(payload);
    if (error) this.logger.error('Lỗi khi ghi nhận sự kiện bất thường:', error);
  }
}