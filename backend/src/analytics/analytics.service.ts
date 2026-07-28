import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// SỬA LỖI: Export các interface để các module khác có thể sử dụng
export interface ProductSalesStat {
  product_id: string;
  mean_daily_sales: number;
  stddev_daily_sales: number;
}

export interface InventoryDiagnosticItem {
  ingredient_name: string;
  stock_quantity: number;
  unit: string;
  consumption_rate: number | string;
  days_remaining: number | string;
  threshold: number;
  is_alert: boolean;
}

@Injectable()
export class AnalyticsService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  /**
   * KHÔI PHỤC HÀM
   */
  async getTodayDiagnostics() {
    const { data: allProducts, error: productsError } = await this.client
      .from('products')
      .select('id, name');
    if (productsError)
      throw new InternalServerErrorException(
        'Không thể lấy danh sách sản phẩm.',
      );
    if (!allProducts) return [];

    const { data: paidStatus, error: statusError } = await this.client
      .from('order_status')
      .select('id')
      .eq('status_name', 'PAID')
      .single();
    if (statusError || !paidStatus)
      throw new InternalServerErrorException('Không tìm thấy status PAID.');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: todayOrders, error: ordersError } = await this.client
      .from('orders')
      .select('id')
      .eq('status_id', paidStatus.id)
      .gte('updated_at', todayStart.toISOString())
      .lte('updated_at', todayEnd.toISOString());

    if (ordersError)
      throw new InternalServerErrorException('Không thể lấy đơn hàng hôm nay.');

    const todaySalesMap = new Map<string, number>();
    if (todayOrders.length > 0) {
      const orderIds = todayOrders.map((o) => o.id);
      const { data: todayDetails, error: detailsError } = await this.client
        .from('order_detail')
        .select('product_id, quantity')
        .in('order_id', orderIds);

      if (detailsError)
        throw new InternalServerErrorException(
          'Không thể lấy chi tiết đơn hàng hôm nay.',
        );

      for (const detail of todayDetails) {
        todaySalesMap.set(
          detail.product_id,
          (todaySalesMap.get(detail.product_id) || 0) + detail.quantity,
        );
      }
    }

    const productIds = allProducts.map((p) => p.id);
    const { data: allStats, error: statsError } = await this.client.rpc(
      'get_products_sales_stats',
      {
        p_product_ids: productIds,
        p_days: 30,
      },
    );
    if (statsError)
      throw new InternalServerErrorException('Không thể lấy dữ liệu thống kê.');

    const statsMap = new Map<string, ProductSalesStat>(
      (allStats || []).map((s: ProductSalesStat) => [s.product_id, s]),
    );

    return allProducts.map((product) => {
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
  }

  /**
   * KHÔI PHỤC HÀM
   */
  async getInventoryDiagnostics(): Promise<InventoryDiagnosticItem[]> {
    const FORECAST_THRESHOLD_DAYS = 3;
    const results: InventoryDiagnosticItem[] = [];

    const { data: ingredients, error } = await this.client
      .from('ingredients')
      .select('id, name, stock_quantity, base_unit, conversion_factor');
    if (error)
      throw new InternalServerErrorException(
        'Không thể lấy danh sách nguyên liệu.',
      );

    for (const ingredient of ingredients) {
      if (!ingredient.conversion_factor || ingredient.conversion_factor <= 0) {
        continue;
      }
      const { data: rateData, error: rpcError } = await this.client.rpc(
        'get_ingredient_consumption_rate',
        { p_ingredient_id: ingredient.id, p_days: 14 },
      );

      if (rpcError) {
        this.logger.error(
          `[Inventory Diagnostics] Lỗi RPC cho '${ingredient.name}':`,
          rpcError,
        );
        continue;
      }

      const consumptionRate = rateData?.[0]?.avg_daily_consumption ?? 0;
      let daysRemaining: number | string = 'N/A';
      if (consumptionRate > 0) {
        const stockInBaseUnit =
          ingredient.stock_quantity * ingredient.conversion_factor;
        daysRemaining = stockInBaseUnit / consumptionRate;
      }

      results.push({
        ingredient_name: ingredient.name,
        stock_quantity: ingredient.stock_quantity,
        unit: ingredient.base_unit,
        consumption_rate: consumptionRate,
        days_remaining:
          typeof daysRemaining === 'number' ? daysRemaining : 'N/A',
        threshold: FORECAST_THRESHOLD_DAYS,
        is_alert:
          typeof daysRemaining === 'number' &&
          daysRemaining < FORECAST_THRESHOLD_DAYS &&
          consumptionRate > 0,
      });
    }
    return results;
  }

  /**
   * KHÔI PHỤC HÀM VÀ THÊM LOGGING
   */
  async getAnomalies(limit: number = 50, unreadOnly: boolean = false) {
    this.logger.log(
      `[Service/getAnomalies] Bắt đầu với limit=${limit}, unreadOnly=${unreadOnly}`,
    );
    let query = this.client
      .from('ai_anomalies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (unreadOnly) {
      this.logger.log(`[Service/getAnomalies] Đang áp dụng bộ lọc unreadOnly.`);
      query = query.eq('is_read', false);
    }
    const { data, error } = await query;
    if (error) {
      this.logger.error('Lỗi khi lấy danh sách anomalies:', error);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách cảnh báo.',
      );
    }
    this.logger.log(
      `[Service/getAnomalies] Query từ CSDL trả về ${data?.length ?? 0} dòng.`,
    );
    return data || [];
  }

  /**
   * KHÔI PHỤC HÀM
   */
  async markAsRead(id: string) {
    const { data, error } = await this.client
      .from('ai_anomalies')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();
    if (error)
      throw new InternalServerErrorException('Không thể cập nhật cảnh báo.');
    if (!data)
      throw new NotFoundException(`Không tìm thấy cảnh báo với ID ${id}.`);
    return data;
  }

  /**
   * SỬA LỖI: Thêm tham số 'force' vào hàm
   */
  async runDailyAnalysis(force: boolean = false) {
    this.logger.log(
      `Bắt đầu quy trình phân tích dữ liệu hàng ngày... (Force mode: ${force})`,
    );
    await this.analyzeProductSalesAnomalies(force);
    await this.analyzeInventoryForecasts(force);
    this.logger.log('Hoàn tất quy trình phân tích.');
    return { message: 'Phân tích dữ liệu hàng ngày đã hoàn tất.' };
  }

  private async analyzeProductSalesAnomalies(force: boolean) {
    this.logger.log('[Sales] Bắt đầu phân tích doanh số...');
    try {
      const diagnostics = await this.getTodayDiagnostics();
      for (const item of diagnostics) {
        if (item.is_anomaly) {
          const message = `Doanh số '${item.product_name}' tăng đột biến, đạt ${item.today_quantity} sản phẩm (so với trung bình ${item.mean_daily_sales}).`;
          const payload = {
            expected_value: item.mean_daily_sales,
            actual_value: item.today_quantity,
            anomaly_score:
              (item.today_quantity - item.mean_daily_sales) /
              (item.stddev_daily_sales || 1),
          };
          await this.createAnomalyRecord(
            'products',
            item.product_name,
            'SALES_SPIKE',
            message,
            'Kiểm tra tồn kho các nguyên liệu liên quan.',
            force,
            payload,
          );
        }
        if (item.today_quantity === 0 && item.mean_daily_sales > 3) {
          const message = `Sản phẩm '${item.product_name}' không bán được ly nào hôm nay (so với trung bình ${item.mean_daily_sales} ly/ngày).`;
          const payload = {
            expected_value: item.mean_daily_sales,
            actual_value: 0,
            anomaly_score: item.mean_daily_sales / 3,
          };
          await this.createAnomalyRecord(
            'products',
            item.product_name,
            'GHOST_PRODUCT',
            message,
            'Cân nhắc chạy khuyến mãi hoặc xem lại vị trí trên menu.',
            force,
            payload,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        '[Sales] Đã xảy ra lỗi trong quá trình phân tích doanh số:',
        error,
      );
    }
    this.logger.log('[Sales] Hoàn tất phân tích doanh số.');
  }

  private async analyzeInventoryForecasts(force: boolean) {
    this.logger.log('[Inventory] Bắt đầu phân tích dự báo tồn kho...');
    const FORECAST_THRESHOLD_DAYS = 3;
    try {
      const { data: ingredients, error } = await this.client
        .from('ingredients')
        .select('id, name, stock_quantity, conversion_factor');
      if (error) {
        this.logger.error(
          '[Inventory] Lỗi khi lấy danh sách nguyên liệu:',
          error,
        );
        return;
      }
      for (const ingredient of ingredients) {
        if (!ingredient.conversion_factor || ingredient.conversion_factor <= 0)
          continue;
        const { data: rateData, error: rpcError } = await this.client.rpc(
          'get_ingredient_consumption_rate',
          { p_ingredient_id: ingredient.id, p_days: 14 },
        );
        if (rpcError) {
          this.logger.error(
            `[Inventory] Lỗi RPC cho '${ingredient.name}':`,
            rpcError,
          );
          continue;
        }
        const consumptionRate = rateData?.[0]?.avg_daily_consumption;
        if (consumptionRate && consumptionRate > 0) {
          const stockInBaseUnit =
            ingredient.stock_quantity * ingredient.conversion_factor;
          let daysRemaining = stockInBaseUnit / consumptionRate;
          if (daysRemaining < 0) {
            daysRemaining = 0;
          }
          if (daysRemaining < FORECAST_THRESHOLD_DAYS) {
            let message: string;
            if (stockInBaseUnit <= 0) {
              message = `Cảnh báo khẩn: Nguyên liệu '${ingredient.name}' ĐÃ HẾT HÀNG.`;
            } else {
              message = `Dự báo: Nguyên liệu '${ingredient.name}' chỉ còn đủ dùng cho khoảng ${Math.floor(daysRemaining)} ngày nữa.`;
            }
            const payload = {
              expected_value: FORECAST_THRESHOLD_DAYS,
              actual_value: daysRemaining,
              anomaly_score: 1 - daysRemaining / FORECAST_THRESHOLD_DAYS,
            };
            await this.createAnomalyRecord(
              'ingredients',
              ingredient.name,
              'INVENTORY_FORECAST',
              message,
              'Lên kế hoạch nhập hàng ngay.',
              force,
              payload,
            );
          }
        }
      }
    } catch (error) {
      this.logger.error(
        '[Inventory] Đã xảy ra lỗi trong quá trình phân tích tồn kho:',
        error,
      );
    }
    this.logger.log('[Inventory] Hoàn tất phân tích dự báo tồn kho.');
  }

  private async createAnomalyRecord(
    entityType: string,
    entityName: string,
    category: string,
    message: string,
    action: string,
    force: boolean,
    extraPayload: object = {},
  ) {
    const { data: entity } = await this.client
      .from(entityType)
      .select('id')
      .eq('name', entityName)
      .single();
    if (!entity) return;

    if (!force) {
      const { data: existing, error: checkError } = await this.client
        .from('ai_anomalies')
        .select('id')
        .eq('entity_id', entity.id)
        .eq('alert_category', category)
        .gte(
          'created_at',
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        );

      if (checkError) {
        this.logger.error('Lỗi khi kiểm tra cảnh báo tồn tại:', checkError);
        return;
      }

      if (existing && existing.length > 0) {
        this.logger.log(`Bỏ qua tạo cảnh báo trùng lặp cho '${entityName}'.`);
        return;
      }
    }

    this.logger.warn(`Đang tạo cảnh báo mới: ${message}`);
    const { error } = await this.client.from('ai_anomalies').insert({
      alert_category: category,
      entity_type: entityType,
      entity_id: entity.id,
      message: message,
      recommended_action: action,
      ...extraPayload,
    });
    if (error) {
      this.logger.error('Lỗi khi ghi nhận sự kiện bất thường:', error);
      throw new InternalServerErrorException(
        `Không thể tạo bản ghi bất thường: ${error.message}`,
      );
    }
  }

  async generateAiReport(scenario: string = 'real') {
    let rawDataStr = '';

    if (scenario === 'spike') {
      rawDataStr = `
        Dữ liệu mô phỏng (Kịch bản: Bão đơn hàng cuối tuần):
        - Doanh thu: 25.500.000 VNĐ (Tăng vọt 800% so với thứ 7 tuần trước).
        - Sản phẩm bán chạy bất thường: "Trà Đào Cam Sả" bán được 350 ly (bình thường chỉ 50 ly) do trời nắng gắt.
        - Sản phẩm ế ẩm: Các món Cà phê nóng không bán được ly nào.
        - Kho nguyên liệu cảnh báo: "Trà Đen", "Mứt Đào" và "Ly Nhựa" đã hoàn toàn CẠN KIỆT.
      `;
    } else if (scenario === 'ghost') {
      rawDataStr = `
        Dữ liệu mô phỏng (Kịch bản: Ế ẩm cuối tháng):
        - Doanh thu: 1.200.000 VNĐ (Giảm thê thảm, thấp nhất trong 3 tháng qua).
        - Khách hàng: Chỉ có 5 đơn hàng cả ngày.
        - Sản phẩm ế ẩm: 90% menu không phát sinh giao dịch.
        - Kho nguyên liệu cảnh báo: "Sữa Tươi" còn tồn 50 lít sẽ HẾT HẠN vào ngày mai. "Trái cây tươi" đang có dấu hiệu hỏng.
      `;
    } else if (scenario === 'fraud') {
      rawDataStr = `
        Dữ liệu mô phỏng (Kịch bản: Nghi ngờ gian lận/Hủy đơn):
        - Tỷ lệ hủy đơn: Có 25 đơn hàng bị nhân viên thu ngân hủy (Void) sau khi in bill (Tăng đột biến 300%).
        - Sản phẩm bị hủy nhiều nhất: "Cà phê sữa" (20 ly bị hủy với lý do "Khách đổi ý").
        - Kho nguyên liệu cảnh báo: Kho cà phê bột bị hụt 1.5 kg so với doanh số thực tế bán ra.
      `;
    } else {
      // Real data aggregation
      const todaySales = await this.getTodayDiagnostics();
      const inventory = await this.getInventoryDiagnostics();
      
      rawDataStr = `
        Dữ liệu thực tế ngày hôm nay:
        - Các sản phẩm có biến động (Top): ${JSON.stringify(todaySales.slice(0, 3))}
        - Các nguyên liệu đang cạn kiệt: ${JSON.stringify(inventory.filter(i => i.is_alert))}
      `;
    }

    const prompt = `
      Bạn là một Giám đốc vận hành F&B chuyên nghiệp của quán "SẪM COFFEE".
      Dưới đây là dữ liệu kinh doanh của quán ngày hôm nay:
      ---
      ${rawDataStr}
      ---
      Yêu cầu:
      Dựa vào dữ liệu trên, hãy viết một Báo Cáo Phân Tích bằng Tiếng Việt (khoảng 3-4 câu).
      Báo cáo phải chỉ ra:
      1. Hiện tượng bất thường (Tốt hoặc xấu).
      2. Rủi ro tiềm ẩn (ví dụ hết nguyên liệu).
      3. Khuyến nghị hành động rõ ràng và thực dụng (Ví dụ: Nhập thêm hàng, chạy khuyến mãi xả kho, v.v.).

      Định dạng bằng Markdown đơn giản, thân thiện, dễ đọc, không cần mở bài hay kết bài dài dòng.
    `;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      
      this.logger.log('Đang gọi Gemini API để sinh báo cáo...');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Lưu vào database
      const { data, error } = await this.client.from('ai_anomalies').insert({
        alert_category: 'AI_INSIGHT',
        entity_type: 'system',
        message: text,
        recommended_action: 'Xem xét và áp dụng các khuyến nghị từ AI.',
      }).select().single();

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      this.logger.error('Lỗi khi gọi Gemini AI:', err);
      throw new InternalServerErrorException('Không thể phân tích dữ liệu bằng AI lúc này: ' + err.message);
    }
  }
}
