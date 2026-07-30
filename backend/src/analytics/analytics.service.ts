import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Cron } from '@nestjs/schedule';

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

  /** Chẩn đoán doanh số sản phẩm hôm nay, phát hiện bất thường bằng Z-Score. */
  async getTodayDiagnostics() {
    const { data: allProducts, error: productsError } = await this.client
      .from('products')
      .select('id, name');
    if (productsError)
      throw new InternalServerErrorException(
        'Không thể lấy danh sách sản phẩm.',
      );
    if (!allProducts) return [];

    const { data: preparingStatus } = await this.client
      .from('order_status')
      .select('id')
      .eq('status_name', 'PREPARING')
      .single();
    const { data: completedStatus } = await this.client
      .from('order_status')
      .select('id')
      .eq('status_name', 'COMPLETED')
      .single();
    
    const paidStatusIds = [preparingStatus?.id, completedStatus?.id].filter(Boolean);
    if (paidStatusIds.length === 0)
      throw new InternalServerErrorException('Không tìm thấy status PREPARING/COMPLETED.');

    // Sử dụng timezone Việt Nam (GMT+7) để tránh lệch ngày khi chuyển sang UTC
    const todayVN = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    const todayStart = new Date(`${todayVN}T00:00:00+07:00`);
    const todayEnd = new Date(`${todayVN}T23:59:59.999+07:00`);

    const { data: todayOrders, error: ordersError } = await this.client
      .from('orders')
      .select('id')
      .in('status_id', paidStatusIds)
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

  /** Chẩn đoán tồn kho: dự báo ngày còn lại cho mỗi nguyên liệu. */
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

  /** Lấy danh sách cảnh báo bất thường từ database. */
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

  /** Đánh dấu cảnh báo đã được xem/xử lý. */
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

  /** Chạy toàn bộ quy trình phân tích AI hàng ngày. Tự động chạy lúc 22:00 mỗi ngày. */
  @Cron('0 22 * * *', { timeZone: 'Asia/Ho_Chi_Minh' })
  async runDailyAnalysis(force: boolean = false) {
    this.logger.log(
      `Bắt đầu quy trình phân tích dữ liệu hàng ngày... (Force mode: ${force})`,
    );
    await this.analyzeProductSalesAnomalies(force);
    await this.analyzeInventoryForecasts(force);
    await this.analyzeInventoryDiscrepancies(force);
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
        const currentHour = parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', hour: 'numeric', hour12: false }));
        if (item.today_quantity === 0 && item.mean_daily_sales > 3 && currentHour >= 15) {
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

  /**
   * Phát hiện chênh lệch tồn kho bất thường.
   * So sánh tốc độ tiêu thụ gần đây (7 ngày) với lịch sử (30 ngày)
   * và kiểm tra các phiếu kiểm kho có điều chỉnh lớn.
   */
  private async analyzeInventoryDiscrepancies(force: boolean) {
    this.logger.log('[Discrepancy] Bắt đầu phân tích chênh lệch tồn kho...');
    try {
      const { data: ingredients, error } = await this.client
        .from('ingredients')
        .select('id, name, stock_quantity, conversion_factor');
      if (error) {
        this.logger.error('[Discrepancy] Lỗi khi lấy nguyên liệu:', error);
        return;
      }

      for (const ingredient of ingredients) {
        if (!ingredient.conversion_factor || ingredient.conversion_factor <= 0)
          continue;

        // So sánh tốc độ tiêu thụ gần đây vs lịch sử
        const { data: recentData } = await this.client.rpc(
          'get_ingredient_consumption_rate',
          { p_ingredient_id: ingredient.id, p_days: 7 },
        );
        const { data: historicalData } = await this.client.rpc(
          'get_ingredient_consumption_rate',
          { p_ingredient_id: ingredient.id, p_days: 30 },
        );

        const recentRate = recentData?.[0]?.avg_daily_consumption ?? 0;
        const historicalRate = historicalData?.[0]?.avg_daily_consumption ?? 0;

        // Phát hiện tiêu thụ tăng đột biến (>80% so với lịch sử)
        if (historicalRate > 0 && recentRate > historicalRate * 1.8) {
          const message = `Nguyên liệu '${ingredient.name}' đang tiêu thụ nhanh bất thường: ${recentRate.toFixed(2)} đơn vị/ngày (lịch sử: ${historicalRate.toFixed(2)} đơn vị/ngày). Có thể do lãng phí hoặc sai công thức.`;
          const payload = {
            expected_value: historicalRate,
            actual_value: recentRate,
            anomaly_score: (recentRate - historicalRate) / (historicalRate || 1),
          };
          await this.createAnomalyRecord(
            'ingredients',
            ingredient.name,
            'INVENTORY_DISCREPANCY',
            message,
            'Kiểm tra lại công thức pha chế và quy trình sử dụng nguyên liệu.',
            force,
            payload,
          );
        }

        // Phát hiện tiêu thụ giảm bất thường (<30% so với lịch sử)
        if (historicalRate > 1 && recentRate < historicalRate * 0.3) {
          const message = `Nguyên liệu '${ingredient.name}' gần như không được sử dụng: ${recentRate.toFixed(2)} đơn vị/ngày (lịch sử: ${historicalRate.toFixed(2)} đơn vị/ngày). Có thể sản phẩm liên quan đang bị tạm ngừng bán.`;
          const payload = {
            expected_value: historicalRate,
            actual_value: recentRate,
            anomaly_score: (historicalRate - recentRate) / (historicalRate || 1),
          };
          await this.createAnomalyRecord(
            'ingredients',
            ingredient.name,
            'INVENTORY_DISCREPANCY',
            message,
            'Kiểm tra lại menu và các sản phẩm sử dụng nguyên liệu này.',
            force,
            payload,
          );
        }
      }

      // Kiểm tra phiếu kiểm kho có điều chỉnh lớn trong 7 ngày gần đây
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: adjustments, error: adjError } = await this.client
        .from('inventory_receipts')
        .select(`
          id, created_at,
          receipt_details (
            quantity,
            ingredients ( id, name )
          )
        `)
        .eq('receipt_type', 'STOCKTAKE_ADJUSTMENT')
        .gte('created_at', sevenDaysAgo);

      if (!adjError && adjustments) {
        for (const receipt of adjustments) {
          for (const detail of (receipt as any).receipt_details || []) {
            const absQty = Math.abs(detail.quantity);
            // Cảnh báo nếu điều chỉnh âm lớn (mất hàng)
            if (detail.quantity < 0 && absQty > 2) {
              const ingredientName = detail.ingredients?.name || 'Không rõ';
              const message = `Phát hiện chênh lệch kho: '${ingredientName}' bị hụt ${absQty} đơn vị trong lần kiểm kho gần nhất. Có thể do hao hụt, hỏng hóc hoặc thất thoát.`;
              const payload = {
                expected_value: 0,
                actual_value: detail.quantity,
                anomaly_score: absQty / 10,
              };
              await this.createAnomalyRecord(
                'ingredients',
                ingredientName,
                'INVENTORY_DISCREPANCY',
                message,
                'Kiểm tra quy trình bảo quản và sử dụng nguyên liệu. Xem xét camera giám sát nếu có.',
                force,
                payload,
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error('[Discrepancy] Lỗi trong quá trình phân tích:', error);
    }
    this.logger.log('[Discrepancy] Hoàn tất phân tích chênh lệch tồn kho.');
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

  /**
   * Tạo báo cáo phân tích AI bằng Google Gemini dựa trên dữ liệu thực tế.
   */
  async generateAiReport() {
    // Thu thập toàn bộ dữ liệu thực tế
    const todaySales = await this.getTodayDiagnostics();
    const inventory = await this.getInventoryDiagnostics();
    const recentAnomalies = await this.getAnomalies(10, false);

    const salesAnomalies = todaySales.filter(s => s.is_anomaly);
    const ghostProducts = todaySales.filter(s => s.today_quantity === 0 && s.mean_daily_sales > 3);
    const lowStockItems = inventory.filter(i => i.is_alert);
    const topSellers = [...todaySales].sort((a, b) => b.today_quantity - a.today_quantity).slice(0, 5);

    const rawDataStr = `
      === DỮ LIỆU THỰC TẾ NGÀY HÔM NAY ===

      1. TỔNG QUAN DOANH SỐ:
      - Tổng sản phẩm đang theo dõi: ${todaySales.length}
      - Sản phẩm có doanh số bất thường (tăng đột biến): ${salesAnomalies.length} sản phẩm
      ${salesAnomalies.map(s => `  + "${s.product_name}": bán ${s.today_quantity} (trung bình ${s.mean_daily_sales})`).join('\n')}
      - Sản phẩm không bán được (ế ẩm): ${ghostProducts.length} sản phẩm
      ${ghostProducts.map(s => `  + "${s.product_name}": 0 ly (trung bình ${s.mean_daily_sales} ly/ngày)`).join('\n')}
      - Top 5 sản phẩm bán chạy nhất hôm nay:
      ${topSellers.map((s, i) => `  ${i + 1}. "${s.product_name}": ${s.today_quantity} ly`).join('\n')}

      2. TÌNH TRẠNG KHO NGUYÊN LIỆU:
      - Tổng nguyên liệu đang theo dõi: ${inventory.length}
      - Nguyên liệu sắp hết (cần nhập gấp): ${lowStockItems.length}
      ${lowStockItems.map(i => `  + "${i.ingredient_name}": còn ${i.stock_quantity} ${i.unit}, dự báo hết sau ${typeof i.days_remaining === 'number' ? Math.floor(i.days_remaining) : i.days_remaining} ngày`).join('\n')}

      3. CẢNH BÁO GẦN ĐÂY (${recentAnomalies.length} cảnh báo mới nhất):
      ${recentAnomalies.slice(0, 5).map(a => `  - [${a.alert_category}] ${a.message}`).join('\n')}
    `;

    const prompt = `
      Bạn là một Giám đốc vận hành F&B chuyên nghiệp của quán "SẪM COFFEE".
      Dưới đây là dữ liệu kinh doanh THỰC TẾ của quán ngày hôm nay:
      ---
      ${rawDataStr}
      ---
      Yêu cầu:
      Dựa vào dữ liệu trên, hãy viết một Báo Cáo Phân Tích chi tiết bằng Tiếng Việt.
      Báo cáo phải bao gồm:
      1. **Tóm tắt tình hình**: Đánh giá tổng quan hoạt động kinh doanh hôm nay (tốt/xấu/bình thường).
      2. **Hiện tượng bất thường**: Chỉ ra các anomaly đáng chú ý (nếu có).
      3. **Rủi cấu tiềm ẩn**: Cảnh báo về nguyên liệu sắp hết, sản phẩm ế ẩm, v.v.
      4. **Khuyến nghị hành động**: Đưa ra 2-3 hành động cụ thể, thực tế mà quản lý nên làm NGAY.

      Định dạng bằng Markdown, sử dụng heading, bullet points, và emoji cho dễ đọc.
      Giữ báo cáo ngắn gọn, đi thẳng vào vấn đề, không dài quá 300 từ.
    `;

    let text = '';
    let attempt = 0;
    const maxRetries = 3;

    while (attempt < maxRetries) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        // Sử dụng gemini-flash-latest (model cũ đang chạy tốt) làm ưu tiên, fallback sang các model khác
        let defaultModel = 'gemini-flash-latest';
        if (attempt === 1) defaultModel = 'gemini-1.5-pro-latest';
        if (attempt === 2) defaultModel = 'gemini-pro';
        
        const modelName = process.env.GEMINI_MODEL || defaultModel;
        const model = genAI.getGenerativeModel({ model: modelName });

        this.logger.log(`Đang gọi Gemini API để sinh báo cáo... (Lần thử: ${attempt + 1}/${maxRetries}, Model: ${modelName})`);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        break;
      } catch (err: any) {
        attempt++;
        this.logger.warn(`Lỗi khi gọi Gemini AI (Lần ${attempt}/${maxRetries}): ${err.message}`);
        
        if (attempt >= maxRetries) {
          this.logger.error('Đã vượt quá số lần thử lại cho Gemini AI.', err);
          throw new InternalServerErrorException('Không thể phân tích dữ liệu bằng AI lúc này: ' + err.message);
        }
        
        // Đọc thời gian retry từ thông báo lỗi (vd: Please retry in 57.4s)
        let delayMs = attempt * 5000;
        const isRateLimit = err.status === 429 || err.message?.includes('429') || err.message?.includes('quota');
        
        if (isRateLimit) {
          const match = err.message?.match(/Please retry in (\d+(?:\.\d+)?)s/);
          if (match && match[1]) {
            delayMs = Math.ceil(parseFloat(match[1])) * 1000 + 2000; // Thêm 2s buffer
          } else {
            delayMs = 18000;
          }
        }
        
        this.logger.log(`Chờ ${delayMs / 1000}s trước khi thử lại...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    try {
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
      this.logger.error('Lỗi khi lưu báo cáo AI vào DB:', err);
      throw new InternalServerErrorException('Không thể lưu báo cáo AI: ' + err.message);
    }
  }
}
