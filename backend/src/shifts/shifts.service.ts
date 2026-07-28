import { Injectable, InternalServerErrorException, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ShiftsService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(ShiftsService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  async getCurrentShift() {
    const { data: shift, error } = await this.client
      .from('shifts')
      .select('*, users!opened_by(full_name)')
      .eq('status', 'OPEN')
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.error('Error fetching current shift', error);
      throw new InternalServerErrorException('Không thể lấy thông tin ca làm việc.');
    }
    
    if (!shift) return null;

    const { data: payments, error: paymentErr } = await this.client
      .from('payments')
      .select('amount, payment_methods!inner(name), orders!inner(shift_id)')
      .eq('orders.shift_id', shift.id);

    let cashSales = 0;
    let transferSales = 0;

    if (!paymentErr && payments) {
      payments.forEach((p: any) => {
        const methodName = p.payment_methods?.name || '';
        if (methodName === 'Tiền mặt' || methodName.toUpperCase() === 'CASH') {
          cashSales += Number(p.amount);
        } else {
          transferSales += Number(p.amount);
        }
      });
    }

    return {
      ...shift,
      metrics: {
        cash_sales: cashSales,
        transfer_sales: transferSales,
        total_sales: cashSales + transferSales,
        expected_cash: Number(shift.starting_cash) + cashSales
      }
    };
  }

  async openShift(userId: string, startingCash: number) {
    const current = await this.getCurrentShift();
    if (current) {
      throw new BadRequestException('Đang có một ca làm việc mở. Vui lòng đóng ca trước khi mở ca mới.');
    }

    const { data, error } = await this.client
      .from('shifts')
      .insert([
        {
          opened_by: userId,
          starting_cash: startingCash,
          status: 'OPEN'
        }
      ])
      .select()
      .single();

    if (error) {
      this.logger.error('Error opening shift', error);
      throw new InternalServerErrorException('Lỗi khi mở ca làm việc.');
    }
    return data;
  }

  async closeShift(shiftId: string, userId: string, endingCash: number, notes?: string) {
    const { data: shift, error: shiftErr } = await this.client.from('shifts').select('*').eq('id', shiftId).single();
    if (shiftErr || !shift) throw new BadRequestException('Không tìm thấy ca làm việc.');
    if (shift.status === 'CLOSED') throw new BadRequestException('Ca này đã đóng.');

    // Chặn chốt ca nếu vẫn còn khách chưa thanh toán (đơn PENDING hoặc PREPARING)
    const { data: activeOrders, error: activeErr } = await this.client
      .from('orders')
      .select('id, order_status!inner(status_name)')
      .eq('shift_id', shiftId)
      .in('order_status.status_name', ['PENDING', 'PREPARING'])
      .limit(1);

    if (activeOrders && activeOrders.length > 0) {
      throw new BadRequestException('Không thể chốt ca: Quán vẫn còn khách chưa thanh toán hoặc chưa phục vụ xong.');
    }

    // Calculate cash from orders in this shift
    const { data: cashPayments, error: paymentErr } = await this.client
      .from('payments')
      .select('amount, payment_methods!inner(name), orders!inner(shift_id)')
      .eq('payment_methods.name', 'Tiền mặt')
      .eq('orders.shift_id', shiftId);

    let totalCashSales = 0;
    if (!paymentErr && cashPayments) {
      totalCashSales = cashPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    }

    const expectedCash = Number(shift.starting_cash) + totalCashSales;

    const { data, error } = await this.client
      .from('shifts')
      .update({
        closed_by: userId,
        end_time: new Date().toISOString(),
        status: 'CLOSED',
        ending_cash: endingCash,
        expected_cash: expectedCash,
        notes: notes
      })
      .eq('id', shiftId)
      .select()
      .single();

    if (error) {
      this.logger.error('Error closing shift', error);
      throw new InternalServerErrorException('Lỗi khi đóng ca làm việc.');
    }
    return data;
  }

  async getHistory(startDate?: string, endDate?: string) {
    let query = this.client
      .from('shifts')
      .select(`
        *,
        opener:users!opened_by(full_name),
        closer:users!closed_by(full_name)
      `)
      .order('start_time', { ascending: false });

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      // Append time to endDate to cover the entire day if only date is provided
      const endDateTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;
      query = query.lte('start_time', endDateTime);
    }

    const { data, error } = await query;
    if (error) {
      this.logger.error('Error fetching shift history:', error);
      throw new InternalServerErrorException('Lỗi khi lấy lịch sử ca làm việc.');
    }

    return data;
  }
}
