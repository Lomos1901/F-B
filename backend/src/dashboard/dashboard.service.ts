import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
   * Lấy toàn bộ dữ liệu Dashboard:
   * - KPIs + biểu đồ + top sản phẩm (RPC cũ)
   * - Doanh thu hôm qua (so sánh tăng/giảm)
   * - Cơ cấu thanh toán hôm nay (tiền mặt / chuyển khoản)
   */
  async getDashboardData(days: number) {
    // Tính ngày hôm nay và hôm qua theo giờ Việt Nam (UTC+7)
    const now = new Date();
    const vnNow = new Date(
      now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
    );
    const todayStr = vnNow.toISOString().split('T')[0];
    const yesterday = new Date(vnNow);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Vòng 1: Gọi RPC cũ + lấy ID trạng thái COMPLETED (song song)
    const [rpcResult, completedStatusResult] = await Promise.all([
      this.client.rpc('get_dashboard_data', { p_days: days }),
      this.client
        .from('payment_status')
        .select('id')
        .eq('code', 'COMPLETED')
        .single(),
    ]);

    if (rpcResult.error) {
      this.logger.error("Lỗi RPC 'get_dashboard_data':", rpcResult.error);
      throw new InternalServerErrorException(
        'Không thể lấy dữ liệu dashboard từ CSDL.',
      );
    }

    const completedStatusId = completedStatusResult.data?.id;
    let yesterdayRevenue = 0;
    let paymentBreakdown: {
      code: string;
      name: string;
      total: number;
      count: number;
    }[] = [];

    if (completedStatusId) {
      // Vòng 2: Lấy doanh thu hôm qua + cơ cấu thanh toán hôm nay (song song)
      const [yesterdayResult, todayPaymentsResult] = await Promise.all([
        this.client
          .from('payments')
          .select('amount')
          .eq('payment_status_id', completedStatusId)
          .gte('created_at', `${yesterdayStr}T00:00:00+07:00`)
          .lt('created_at', `${todayStr}T00:00:00+07:00`),
        this.client
          .from('payments')
          .select('amount, payment_methods(code, name)')
          .eq('payment_status_id', completedStatusId)
          .gte('created_at', `${todayStr}T00:00:00+07:00`),
      ]);

      // Tổng doanh thu hôm qua
      yesterdayRevenue =
        yesterdayResult.data?.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        ) || 0;

      // Nhóm thanh toán hôm nay theo phương thức
      const methodMap = new Map<
        string,
        { name: string; total: number; count: number }
      >();
      todayPaymentsResult.data?.forEach((p: any) => {
        const code = p.payment_methods?.code || 'UNKNOWN';
        const name = p.payment_methods?.name || 'Khác';
        const existing = methodMap.get(code) || {
          name,
          total: 0,
          count: 0,
        };
        existing.total += Number(p.amount);
        existing.count += 1;
        methodMap.set(code, existing);
      });
      paymentBreakdown = Array.from(methodMap.entries()).map(
        ([code, data]) => ({
          code,
          name: data.name,
          total: data.total,
          count: data.count,
        }),
      );
    }

    return {
      ...rpcResult.data,
      yesterdayRevenue,
      paymentBreakdown,
    };
  }
}
