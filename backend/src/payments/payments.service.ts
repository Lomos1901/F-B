import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { OrdersService } from '../orders/orders.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreatePaymentDto } from './dto/create-payment.dto';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly ordersService: OrdersService,
  ) {
    this.client = this.supabaseService.getAdminClient();
  }

  async getPaymentMethods() {
    const { data, error } = await this.client
      .from('payment_methods')
      .select('id, name, code')
      .neq('code', 'MOMO')
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Error fetching payment methods', error);
      throw new InternalServerErrorException('Lỗi khi lấy danh sách phương thức thanh toán');
    }
    return data;
  }

  async createPayment(createPaymentDto: CreatePaymentDto, cashierId?: string) {
    const { order_id, amount, payment_method_code, note } = createPaymentDto;

    // 0. BẢO MẬT: Kiểm tra xem đơn hàng có phải đang ở trạng thái PENDING không
    // Ngăn chặn spam gọi API thanh toán nhiều lần gây trừ kho lặp lại
    const { data: orderData, error: checkOrderError } = await this.client
      .from('orders')
      .select('order_status(status_name)')
      .eq('id', order_id)
      .single();
    
    if (checkOrderError || !orderData) {
      throw new BadRequestException('Không tìm thấy đơn hàng!');
    }
    
    const statusName = (orderData as any).order_status?.status_name || (orderData as any).order_status?.[0]?.status_name;
    if (statusName !== 'PENDING') {
      throw new BadRequestException('Đơn hàng này đã được thanh toán hoặc không còn hợp lệ!');
    }

    // 1. Lấy ID của phương thức thanh toán
    const { data: methodData, error: methodError } = await this.client
      .from('payment_methods')
      .select('id')
      .eq('code', payment_method_code)
      .single();

    if (methodError || !methodData) {
      throw new BadRequestException('Phương thức thanh toán không hợp lệ');
    }

    // 2. Lấy ID của trạng thái thanh toán COMPLETED
    const { data: statusData, error: statusError } = await this.client
      .from('payment_status')
      .select('id')
      .eq('code', 'COMPLETED')
      .single();

    if (statusError || !statusData) {
      throw new InternalServerErrorException('Không tìm thấy trạng thái thanh toán');
    }

    // 3. Tạo record thanh toán
    const { data: paymentData, error: paymentError } = await this.client
      .from('payments')
      .insert({
        order_id,
        amount,
        payment_method_id: methodData.id,
        payment_status_id: statusData.id,
        cashier_id: cashierId,
        note,
      })
      .select()
      .single();

    if (paymentError) {
      this.logger.error('Lỗi khi lưu thanh toán', paymentError);
      throw new InternalServerErrorException('Không thể lưu giao dịch thanh toán');
    }

    // 4. Cập nhật trạng thái đơn hàng sang PREPARING (Thay vì PAID để KDS có thể thấy đơn)
    try {
      await this.ordersService.updateStatus(order_id, { status: 'PREPARING' });
    } catch (err) {
      this.logger.error(`Thanh toán thành công nhưng cập nhật trạng thái đơn ${order_id} lỗi`, err);
      // Vẫn trả về thành công nhưng có thể cảnh báo log
    }

    return {
      message: 'Thanh toán thành công',
      payment: paymentData,
    };
  }

  async getBankInfo() {
    const { data, error } = await this.client
      .from('store_bank_info')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      // Trả về default nếu chưa có DB
      return { bank_bin: '970422', account_number: '123456789', account_name: 'SAM COFFEE' };
    }
    return data;
  }

  async updateBankInfo(body: { bank_bin: string, account_number: string, account_name: string }) {
    const { data, error } = await this.client
      .from('store_bank_info')
      .upsert({ 
        id: 1, 
        bank_bin: body.bank_bin, 
        account_number: body.account_number, 
        account_name: body.account_name 
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Lỗi khi cập nhật thông tin ngân hàng', error);
      throw new InternalServerErrorException('Lỗi cập nhật thông tin ngân hàng');
    }
    return data;
  }

  async handleSepayWebhook(orderId: string, amount: number, sepayTransactionId: string) {
    // Kiểm tra xem giao dịch này đã được xử lý chưa
    const { data: existingPayment } = await this.client
      .from('payments')
      .select('id')
      .ilike('note', `%SePay auto #${sepayTransactionId}%`)
      .limit(1)
      .single();

    if (existingPayment) {
      this.logger.log(`Bỏ qua giao dịch SePay #${sepayTransactionId} đã được xử lý.`);
      return;
    }

    // Tra cứu đơn hàng
    const { data: orderData, error: checkOrderError } = await this.client
      .from('orders')
      .select('id, order_status(status_name)')
      .eq('id', orderId)
      .single();

    if (checkOrderError || !orderData) {
      this.logger.warn(`Không tìm thấy đơn hàng ${orderId} từ SePay webhook.`);
      return;
    }

    const statusName = (orderData as any).order_status?.status_name || (orderData as any).order_status?.[0]?.status_name;
    if (statusName !== 'PENDING') {
      this.logger.warn(`Đơn hàng ${orderId} không ở trạng thái PENDING. Trạng thái hiện tại: ${statusName}`);
      return;
    }

    // Tạo thanh toán tự động
    try {
      await this.createPayment({
        order_id: orderId,
        amount,
        payment_method_code: 'BANK_TRANSFER',
        note: `SePay auto #${sepayTransactionId}`
      });
      this.logger.log(`Đã xử lý thanh toán tự động cho đơn hàng ${orderId} (SePay #${sepayTransactionId})`);
    } catch (error) {
      this.logger.error(`Lỗi khi tạo thanh toán tự động cho đơn hàng ${orderId} (SePay #${sepayTransactionId}):`, error);
    }
  }
}
