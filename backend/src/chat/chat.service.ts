import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI, Tool, ChatSession, GenerativeModel } from '@google/generative-ai';
import { SupabaseService } from '../supabase/supabase.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { DashboardService } from '../dashboard/dashboard.service';

@Injectable()
export class ChatService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly rateLimits = new Map<string, { count: number; resetTime: number }>();
  private readonly MAX_REQUESTS = 30;
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly analyticsService: AnalyticsService,
    private readonly dashboardService: DashboardService,
  ) {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
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

  private async executeFunctionCall(name: string, args: any): Promise<any> {
    try {
      switch (name) {
        case 'get_top_selling_products': {
          const diagnostics = await this.analyticsService.getTodayDiagnostics();
          return diagnostics
            .sort((a: any, b: any) => (b.today_quantity || 0) - (a.today_quantity || 0))
            .slice(0, 10);
        }
        case 'get_low_inventory': {
          const inventory = await this.analyticsService.getInventoryDiagnostics();
          return inventory.filter((item: any) => item.is_alert === true);
        }
        case 'get_recent_alerts': {
          const limit = args.limit || 10;
          const anomalies = await this.analyticsService.getAnomalies(limit);
          return anomalies;
        }
        case 'get_dashboard_summary': {
          const days = args.days || 7;
          const dashboardData = await this.dashboardService.getDashboardData(days);
          return dashboardData;
        }
        case 'get_inventory_full_report': {
          const inventory = await this.analyticsService.getInventoryDiagnostics();
          return inventory;
        }
        case 'get_highest_order_today': {
          const supabase = this.supabaseService.getAdminClient();
          const targetDate = new Date();
          targetDate.setHours(0, 0, 0, 0);
          const startOfDay = targetDate.toISOString();
          
          const endDate = new Date(targetDate);
          endDate.setHours(23, 59, 59, 999);
          const endOfDay = endDate.toISOString();

          const { data, error } = await supabase
            .from('orders')
            .select('id, table_number, total_price, created_at, note')
            .gte('created_at', startOfDay)
            .lte('created_at', endOfDay)
            .order('total_price', { ascending: false })
            .limit(1)
            .single();

          if (error) {
            return { error: 'Không tìm thấy đơn hàng nào hôm nay' };
          }
          return data;
        }
        default:
          return { error: 'Function not found' };
      }
    } catch (error) {
      console.error(`Error executing function ${name}:`, error);
      return { error: 'Failed to execute function' };
    }
  }

  async chat(userId: string, userMessage: string, conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = []) {
    this.checkRateLimit(userId);

    try {
      const tools: Tool[] = [{
        functionDeclarations: [
          {
            name: 'get_top_selling_products',
            description: 'Lấy danh sách sản phẩm bán chạy nhất hôm nay kèm số lượng đã bán và so sánh với trung bình',
            parameters: { type: 'OBJECT', properties: {} } as any
          },
          {
            name: 'get_low_inventory',
            description: 'Lấy danh sách nguyên liệu sắp hết',
            parameters: { type: 'OBJECT', properties: {} } as any
          },
          {
            name: 'get_recent_alerts',
            description: 'Lấy các cảnh báo bất thường gần đây',
            parameters: { 
              type: 'OBJECT', 
              properties: {
                limit: {
                  type: 'NUMBER',
                  description: 'Số lượng cảnh báo cần lấy (mặc định 10)'
                }
              }
            } as any
          },
          {
            name: 'get_dashboard_summary',
            description: 'Lấy tổng quan doanh thu, số đơn hàng',
            parameters: { 
              type: 'OBJECT', 
              properties: {
                days: {
                  type: 'NUMBER',
                  description: 'Số ngày cần lấy dữ liệu (mặc định 7)'
                }
              }
            } as any
          },
          {
            name: 'get_inventory_full_report',
            description: 'Lấy báo cáo đầy đủ tồn kho tất cả nguyên liệu',
            parameters: { type: 'OBJECT', properties: {} } as any
          },
          {
            name: 'get_highest_order_today',
            description: 'Tìm hóa đơn có giá trị lớn nhất trong ngày hôm nay',
            parameters: { type: 'OBJECT', properties: {} } as any
          }
        ]
      }];

      const supabase = this.supabaseService.getAdminClient();
      const { data: menuData } = await supabase
        .from('products')
        .select('name, price, categories(name)')
        .eq('is_active', true);
        
      let menuContext = '';
      if (menuData && menuData.length > 0) {
        menuContext = '\n--- MENU HIỆN TẠI CỦA QUÁN ---\n' + 
          menuData.map((p: any) => `- ${p.name} (${p.categories?.name || 'Khác'}): ${p.price.toLocaleString('vi-VN')}đ`).join('\n');
      }

      let attempt = 0;
      const maxRetries = 4;
      let lastError: any;

      while (attempt < maxRetries) {
        try {
          let defaultModel = 'gemini-flash-latest';
          if (attempt === 1) defaultModel = 'gemini-flash-lite-latest';
          if (attempt === 2) defaultModel = 'gemini-3.5-flash-lite';
          if (attempt === 3) defaultModel = 'gemini-2.5-flash-lite';

          const modelName = attempt === 0 ? (process.env.GEMINI_MODEL || defaultModel) : defaultModel;
          const model: GenerativeModel = this.genAI.getGenerativeModel({ 
            model: modelName,
            tools: tools,
            systemInstruction: "Bạn là Trợ Lý AI của quán LUMOS COFFEE. Bạn luôn xưng 'Em' và gọi chủ quán là 'Sếp'.\nPhong cách: chuyên nghiệp, nhanh nhẹn, đi thẳng vào trọng tâm.\nQuy tắc:\n- Trả lời ngắn gọn, dùng gạch đầu dòng và in đậm số liệu quan trọng.\n- TUYỆT ĐỐI không bịa số liệu. Chỉ dùng data từ các hàm được cung cấp hoặc Menu được tiêm vào.\n- Nếu không có data, báo thẳng 'Em chưa có dữ liệu về vấn đề này, Sếp'.\n- Không trả lời các câu hỏi không liên quan đến vận hành quán.\n- Khi liệt kê, giới hạn tối đa 10 mục." + menuContext
          });

          const chatSession: ChatSession = model.startChat({
            history: conversationHistory,
          });

          const result = await chatSession.sendMessage(userMessage);
          const call = result.response.functionCalls()?.[0];

          if (call) {
            const functionResult = await this.executeFunctionCall(call.name, call.args);
            
            const followUpResult = await chatSession.sendMessage(
              `Dữ liệu từ hệ thống:\n${JSON.stringify(functionResult)}`
            );
            
            return {
              reply: followUpResult.response.text()
            };
          }

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
