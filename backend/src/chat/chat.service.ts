import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { SupabaseService } from '../supabase/supabase.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { DashboardService } from '../dashboard/dashboard.service';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable()
export class ChatService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly rateLimits = new Map<string, { count: number; resetTime: number }>();
  private readonly MAX_REQUESTS = 30;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  // Cache data snapshot — chỉ query DB 1 lần đầu, dùng lại cho cả phiên chat
  private cache = new Map<string, CacheEntry<any>>();
  private readonly SNAPSHOT_CACHE_TTL = 5 * 60 * 1000; // 5 phút — đủ cho 1 phiên chat

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly analyticsService: AnalyticsService,
    private readonly dashboardService: DashboardService,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.expiry) return entry.data;
    this.cache.delete(key);
    return null;
  }

  private setCache<T>(key: string, data: T, ttl: number): T {
    this.cache.set(key, { data, expiry: Date.now() + ttl });
    return data;
  }

  private checkRateLimit(userId: string): void {
    const now = Date.now();
    const userRecord = this.rateLimits.get(userId);

    if (!userRecord) {
      this.rateLimits.set(userId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW_MS });
      return;
    }

    if (now > userRecord.resetTime) {
      this.rateLimits.set(userId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW_MS });
      return;
    }

    if (userRecord.count >= this.MAX_REQUESTS) {
      throw new HttpException('Rate limit exceeded. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    userRecord.count++;
  }

  /**
   * Pre-fetch TẤT CẢ dữ liệu cần thiết 1 lần duy nhất, đóng gói thành chuỗi text.
   * Cache 5 phút — tin nhắn đầu tiên query DB, các tin nhắn sau dùng cache.
   */
  private async buildDataSnapshot(): Promise<string> {
    const cached = this.getCached<string>('data_snapshot');
    if (cached) return cached;

    // Query song song tất cả data cần thiết — CHỈ 1 LẦN
    const [diagnostics, inventory, alerts, dashboard, menuText] = await Promise.all([
      this.analyticsService.getTodayDiagnostics().catch(() => []),
      this.analyticsService.getInventoryDiagnostics().catch(() => []),
      this.analyticsService.getAnomalies(10).catch(() => []),
      this.dashboardService.getDashboardData(7).catch(() => null),
      this.getMenuText(),
    ]);

    // Top sản phẩm bán chạy
    const topSellers = [...diagnostics]
      .sort((a: any, b: any) => (b.today_quantity || 0) - (a.today_quantity || 0))
      .slice(0, 10);

    // Nguyên liệu cảnh báo
    const lowStock = inventory.filter((i: any) => i.is_alert);

    // Tổng doanh thu hôm nay
    const totalSold = (diagnostics as any[]).reduce((sum: number, p: any) => sum + (p.today_quantity || 0), 0);

    // Các sản phẩm ế ẩm (bán 0 ly nhưng trung bình > 3)
    const ghostProducts = (diagnostics as any[]).filter(
      (p: any) => p.today_quantity === 0 && p.mean_daily_sales > 3
    );

    // Đóng gói thành chuỗi text gọn gàng
    const snapshot = `
--- DỮ LIỆU HỆ THỐNG (Cập nhật lúc ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}) ---

📊 DOANH SỐ HÔM NAY (Tổng: ${totalSold} ly):
${topSellers.length > 0
  ? topSellers.map((p: any) => `- ${p.product_name}: ${p.today_quantity} ly (TB: ${p.mean_daily_sales}/ngày${p.is_anomaly ? ' ⚡TĂNG ĐỘT BIẾN' : ''})`).join('\n')
  : '- Chưa có dữ liệu doanh số hôm nay'}

👻 MÓN Ế ẨM (Bán 0 ly hôm nay):
${ghostProducts.length > 0
  ? ghostProducts.map((p: any) => `- ${p.product_name} (TB bán: ${p.mean_daily_sales} ly/ngày)`).join('\n')
  : '- Không có món nào ế ẩm'}

📦 TÌNH TRẠNG KHO:
${lowStock.length > 0
  ? lowStock.map((i: any) => `- ⚠️ ${i.ingredient_name}: còn ${i.stock_quantity} ${i.unit}, dự báo hết sau ${typeof i.days_remaining === 'number' ? Math.floor(i.days_remaining) : i.days_remaining} ngày`).join('\n')
  : '- Kho ổn định, không có nguyên liệu nào sắp hết'}

⚠️ CẢNH BÁO GẦN ĐÂY:
${alerts.length > 0
  ? alerts.slice(0, 5).map((a: any) => `- ${a.message}`).join('\n')
  : '- Không có cảnh báo mới'}

💰 TỔNG QUAN 7 NGÀY:
${dashboard ? JSON.stringify(dashboard) : 'Chưa có dữ liệu tổng quan'}

🍽️ MENU HIỆN TẠI:
${menuText}
`.trim();

    return this.setCache('data_snapshot', snapshot, this.SNAPSHOT_CACHE_TTL);
  }

  /** Lấy danh sách menu đóng gói thành text */
  private async getMenuText(): Promise<string> {
    try {
      const supabase = this.supabaseService.getAdminClient();
      const { data: menuData } = await supabase
        .from('products')
        .select('name, price, categories(name)')
        .eq('is_active', true);

      if (!menuData || menuData.length === 0) return '- Chưa có sản phẩm nào';

      return menuData
        .map((p: any) => `- ${p.name} (${p.categories?.name || 'Khác'}): ${p.price.toLocaleString('vi-VN')}đ`)
        .join('\n');
    } catch {
      return '- Không thể tải menu';
    }
  }

  async chat(userId: string, userMessage: string, conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = []) {
    this.checkRateLimit(userId);

    try {
      // Lấy data snapshot — tin nhắn đầu query DB, các tin nhắn sau dùng cache
      const dataSnapshot = await this.buildDataSnapshot();

      let attempt = 0;
      const maxRetries = 2;
      let lastError: any;

      while (attempt < maxRetries) {
        try {
          let defaultModel = 'gemini-flash-latest';
          if (attempt === 1) defaultModel = 'gemini-flash-lite-latest';

          const modelName = attempt === 0 ? (process.env.GEMINI_MODEL || defaultModel) : defaultModel;
          const model: GenerativeModel = this.genAI.getGenerativeModel({
            model: modelName,
            // KHÔNG CÓ tools — data đã có sẵn trong prompt, chỉ cần 1 lần gọi AI
            systemInstruction: `Bạn là Trợ Lý AI của quán SAM COFFEE. Bạn luôn xưng 'Em' và gọi chủ quán là 'Sếp'.

NGUYÊN TẮC TUYỆT ĐỐI - VI PHẠM = THẤT BẠI:
1. Chỉ sử dụng dữ liệu trong phần "DỮ LIỆU HỆ THỐNG" bên dưới để trả lời. KHÔNG BAO GIỜ tự bịa số liệu.
2. Nếu dữ liệu không có thông tin liên quan, nói thẳng: "Em tra hệ thống thì chưa có dữ liệu về vấn đề này, Sếp."
3. Hệ thống KHÔNG CÓ: cảm biến nhiệt độ, camera, GPS, cảm biến độ ẩm, hay bất kỳ thiết bị IoT nào. KHÔNG ĐƯỢC nhắc đến những thứ này.
4. Chỉ trả lời về: doanh số, thực đơn, nguyên liệu, tồn kho, cảnh báo, đơn hàng, ca làm việc.
5. Trả lời ngắn gọn, dùng gạch đầu dòng, in đậm số liệu. Tối đa 10 mục khi liệt kê.

Phong cách: chuyên nghiệp, nhanh nhẹn, đi thẳng vào số liệu thực.

${dataSnapshot}`
          });

          // Lọc bỏ timestamp khỏi history — Gemini API chỉ chấp nhận role + parts
          const cleanHistory = conversationHistory.map(({ role, parts }) => ({ role, parts }));

          const chatSession = model.startChat({
            history: cleanHistory,
          });

          // CHỈ 1 LẦN gọi AI — không có function call roundtrip
          const result = await chatSession.sendMessage(userMessage);

          return {
            reply: result.response.text()
          };
        } catch (error: any) {
          attempt++;
          lastError = error;
          console.warn(`Chat error on attempt ${attempt}/${maxRetries}: ${error.message}`);
          if (attempt >= maxRetries) {
            break;
          }
        }
      }

      console.error('Final Chat error:', lastError);
      throw new HttpException('Hệ thống AI đang quá tải. Sếp vui lòng thử lại sau ít phút nhé.', HttpStatus.TOO_MANY_REQUESTS);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Chat error:', error);
      throw new HttpException('Lỗi khi xử lý yêu cầu AI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
