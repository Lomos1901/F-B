// backend/src/orders/orders.service.ts

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  private async _getStatusId(
    statusName: string,
    statusTable: 'order_status' | 'task_status',
  ): Promise<string> {
    const { data, error } = await this.client
      .from(statusTable)
      .select('id')
      .eq('status_name', statusName.toUpperCase())
      .single();
    if (error || !data)
      throw new InternalServerErrorException(
        `Trạng thái không hợp lệ: '${statusName}' trong bảng '${statusTable}'.`,
      );
    return data.id;
  }

  async create(createOrderDto: CreateOrderDto, createdByUserId?: string) {
    const { table_number, items } = createOrderDto;
    const totalPrice = items.reduce(
      (sum, item) => sum + item.price_at_order * item.quantity,
      0,
    );
    const pendingStatusId = await this._getStatusId('PENDING', 'order_status');
    const todoTaskStatusId = await this._getStatusId('TODO', 'task_status');
    const { data: orderData, error: orderError } = await this.client
      .from('orders')
      .insert({
        table_number,
        total_price: totalPrice,
        status_id: pendingStatusId,
        created_by: createdByUserId,
      })
      .select('id')
      .single();
    if (orderError) {
      this.logger.error('Lỗi khi tạo record order chính:', orderError);
      throw new InternalServerErrorException('Lỗi hệ thống khi tạo đơn hàng.');
    }
    const newOrderId = orderData.id;
    const orderDetailPayload = items.map((item) => ({
      order_id: newOrderId,
      product_id: item.product_id,
      quantity: item.quantity,
    }));
    const { data: orderDetailData, error: detailError } = await this.client
      .from('order_detail')
      .insert(orderDetailPayload)
      .select('id');
    if (detailError) {
      await this.client.from('orders').delete().eq('id', newOrderId);
      this.logger.error('Lỗi khi tạo order_detail:', detailError);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi ghi chi tiết đơn hàng.',
      );
    }
    const preparationTasksPayload = orderDetailData.map((detail) => ({
      order_detail_id: detail.id,
      task_status_id: todoTaskStatusId,
      barista_id: null,
    }));
    const { error: taskError } = await this.client
      .from('preparation_tasks')
      .insert(preparationTasksPayload);
    if (taskError)
      this.logger.error('Lỗi khi tạo preparation_tasks:', taskError);
    return {
      message: `Đơn hàng cho bàn ${table_number} đã được ghi nhận.`,
      orderId: newOrderId,
    };
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const newStatusName = updateOrderStatusDto.status.toUpperCase();
    const newStatusId = await this._getStatusId(newStatusName, 'order_status');

    const { data: updatedOrder, error } = await this.client
      .from('orders')
      .update({ status_id: newStatusId })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      throw new InternalServerErrorException(
        `Lỗi khi cập nhật trạng thái đơn hàng: ${error.message}`,
      );
    }

    if (newStatusName === 'PAID') {
      try {
        this.logger.log(`Đơn hàng ${id} đã thanh toán. Bắt đầu trừ kho...`);
        await this.deductStockForOrder(id);
      } catch (deductionError) {
        this.logger.error(
          `LỖI TRỪ KHO cho đơn hàng ${id}:`,
          (deductionError as Error).stack,
        );
        throw new InternalServerErrorException(
          `Cập nhật trạng thái thành công, nhưng trừ kho thất bại: ${(deductionError as Error).message}`,
        );
      }
    }

    return updatedOrder;
  }

  async getOrdersByStatus(statusName: string) {
    const statusId = await this._getStatusId(statusName, 'order_status');

    const { data, error } = await this.client
      .from('orders')
      .select(
        `
        id, table_number, total_price, created_at,
        order_status ( status_name ),
        order_detail (
          quantity,
          products ( name, price )
        )
      `,
      )
      .eq('status_id', statusId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(
        `Lỗi khi lấy đơn hàng theo trạng thái '${statusName}':`,
        error,
      );
      throw new InternalServerErrorException(`Lỗi khi lấy danh sách đơn hàng.`);
    }
    return data;
  }

  async getOpenOrderByTable(tableNumber: string) {
    const { data, error } = await this.client
      .from('orders')
      .select(
        `id, table_number, total_price, created_at, order_status ( status_name ), order_detail (quantity, products ( name, price ))`,
      )
      .eq('table_number', tableNumber)
      .in('order_status.status_name', ['PENDING', 'PREPARING', 'COMPLETED'])
      .order('created_at', { ascending: false });
    if (error) {
      this.logger.error(
        `Lỗi khi lấy đơn hàng mở của bàn ${tableNumber}:`,
        error,
      );
      throw new InternalServerErrorException('Lỗi truy vấn đơn hàng của bàn.');
    }
    return data.length > 0 ? data[0] : null;
  }

  /**
   * NÂNG CẤP: Ủy thác toàn bộ logic trừ kho cho hàm RPC trong CSDL.
   * Hàm này giờ đây chỉ cần gọi hàm 'handle_sale_deduction' và xử lý lỗi.
   * @param orderId ID của đơn hàng cần trừ kho.
   */
  private async deductStockForOrder(orderId: string) {
    this.logger.log(
      `Bắt đầu gọi RPC 'handle_sale_deduction' cho order: ${orderId}`,
    );

    const { error } = await this.client.rpc('handle_sale_deduction', {
      p_order_id: orderId,
    });

    // Nếu hàm RPC trả về lỗi, ném ra một exception để transaction ở tầng ứng dụng có thể bắt được.
    if (error) {
      this.logger.error(
        `Lỗi khi thực thi RPC 'handle_sale_deduction' cho order ${orderId}:`,
        error,
      );
      throw new InternalServerErrorException(
        `Lỗi từ CSDL khi trừ kho: ${error.message}`,
      );
    }

    this.logger.log(
      `RPC 'handle_sale_deduction' thực thi thành công cho order: ${orderId}`,
    );
  }
}
