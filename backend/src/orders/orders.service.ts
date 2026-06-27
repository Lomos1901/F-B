// backend/src/orders/orders.service.ts

import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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

  private async _getStatusId(statusName: string, statusTable: 'order_status' | 'task_status'): Promise<string> {
    const { data, error } = await this.client.from(statusTable).select('id').eq('status_name', statusName.toUpperCase()).single();
    if (error || !data) throw new InternalServerErrorException(`Trạng thái không hợp lệ: '${statusName}' trong bảng '${statusTable}'.`);
    return data.id;
  }

  async create(createOrderDto: CreateOrderDto, createdByUserId?: string) {
    const { table_number, items } = createOrderDto;
    const totalPrice = items.reduce((sum, item) => sum + item.price_at_order * item.quantity, 0);
    const pendingStatusId = await this._getStatusId('PENDING', 'order_status');
    const todoTaskStatusId = await this._getStatusId('TODO', 'task_status');
    const { data: orderData, error: orderError } = await this.client.from('orders').insert({ table_number, total_price: totalPrice, status_id: pendingStatusId, created_by: createdByUserId }).select('id').single();
    if (orderError) {
      this.logger.error('Lỗi khi tạo record order chính:', orderError);
      throw new InternalServerErrorException('Lỗi hệ thống khi tạo đơn hàng.');
    }
    const newOrderId = orderData.id;
    const orderDetailPayload = items.map(item => ({ order_id: newOrderId, product_id: item.product_id, quantity: item.quantity }));
    const { data: orderDetailData, error: detailError } = await this.client.from('order_detail').insert(orderDetailPayload).select('id');
    if (detailError) {
      await this.client.from('orders').delete().eq('id', newOrderId);
      this.logger.error('Lỗi khi tạo order_detail:', detailError);
      throw new InternalServerErrorException('Lỗi hệ thống khi ghi chi tiết đơn hàng.');
    }
    const preparationTasksPayload = orderDetailData.map(detail => ({ order_detail_id: detail.id, task_status_id: todoTaskStatusId, barista_id: null }));
    const { error: taskError } = await this.client.from('preparation_tasks').insert(preparationTasksPayload);
    if (taskError) this.logger.error('Lỗi khi tạo preparation_tasks:', taskError);
    return { message: `Đơn hàng cho bàn ${table_number} đã được ghi nhận.`, orderId: newOrderId };
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const newStatusName = updateOrderStatusDto.status.toUpperCase();
    const newStatusId = await this._getStatusId(newStatusName, 'order_status');

    const { data: updatedOrder, error } = await this.client.from('orders').update({ status_id: newStatusId }).eq('id', id).select().single();
    if (error) {
      throw new InternalServerErrorException(`Lỗi khi cập nhật trạng thái đơn hàng: ${error.message}`);
    }

    if (newStatusName === 'PAID') {
      try {
        this.logger.log(`Đơn hàng ${id} đã thanh toán. Bắt đầu trừ kho...`);
        await this.deductStockForOrder(id);
      } catch (deductionError) {
        this.logger.error(`LỖI TRỪ KHO cho đơn hàng ${id}:`, (deductionError as Error).stack);
        throw new InternalServerErrorException(`Cập nhật trạng thái thành công, nhưng trừ kho thất bại: ${(deductionError as Error).message}`);
      }
    }

    return updatedOrder;
  }

  async getOrdersByStatus(statusName: string) {
    const statusId = await this._getStatusId(statusName, 'order_status');

    const { data, error } = await this.client
      .from('orders')
      .select(`
        id, table_number, total_price, created_at,
        order_status ( status_name ),
        order_detail (
          quantity,
          products ( name, price )
        )
      `)
      .eq('status_id', statusId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error(`Lỗi khi lấy đơn hàng theo trạng thái '${statusName}':`, error);
      throw new InternalServerErrorException(`Lỗi khi lấy danh sách đơn hàng.`);
    }
    return data;
  }

  async getOpenOrderByTable(tableNumber: string) {
    const { data, error } = await this.client.from('orders').select(`id, table_number, total_price, created_at, order_status ( status_name ), order_detail (quantity, products ( name, price ))`).eq('table_number', tableNumber).in('order_status.status_name', ['PENDING', 'PREPARING', 'COMPLETED']).order('created_at', { ascending: false });
    if (error) {
      this.logger.error(`Lỗi khi lấy đơn hàng mở của bàn ${tableNumber}:`, error);
      throw new InternalServerErrorException('Lỗi truy vấn đơn hàng của bàn.');
    }
    return data.length > 0 ? data[0] : null;
  }

  /**
   * Thực hiện trừ kho cho một đơn hàng đã thanh toán và ghi nhận lịch sử xuất kho.
   * @param orderId ID của đơn hàng cần trừ kho.
   */
  private async deductStockForOrder(orderId: string) {
    // Lấy chi tiết các món trong đơn hàng.
    const { data: orderDetails, error: itemsError } = await this.client.from('order_detail').select('quantity, product_id').eq('order_id', orderId);
    if (itemsError || !orderDetails) return;

    // Lấy công thức của các món đó.
    const productIds = orderDetails.map(item => item.product_id);
    const { data: recipes, error: recipesError } = await this.client.from('recipes').select('product_id, ingredient_id, quantity').in('product_id', productIds);
    if (recipesError || !recipes) return;

    // Lấy thông tin tồn kho hiện tại của các nguyên liệu.
    const ingredientIds = [...new Set(recipes.map(r => r.ingredient_id))];
    const { data: ingredients, error: ingredientsError } = await this.client.from('ingredients').select('id, stock_quantity, conversion_factor').in('id', ingredientIds);
    if (ingredientsError || !ingredients) return;


    // Tạo một "bản đồ" để cộng dồn lượng cần trừ cho mỗi nguyên liệu.
    const ingredientsMap = new Map(ingredients.map(i => [i.id, i]));
    const deductionMap = new Map<string, number>();

    // Duyệt qua từng món trong đơn hàng để tính toán.
    for (const detail of orderDetails) {
      const productRecipes = recipes.filter(r => r.product_id === detail.product_id);
      for (const recipe of productRecipes) {
        const ingredientInfo = ingredientsMap.get(recipe.ingredient_id);
        if (!ingredientInfo) continue;

        // Quy đổi từ đơn vị pha chế về đơn vị lưu kho (đơn vị nhập).
        const conversionFactor = ingredientInfo.conversion_factor || 1;
        const deductionInBaseUnits = (recipe.quantity * detail.quantity) / conversionFactor;

        // Cộng dồn lượng cần trừ.
        const currentDeduction = deductionMap.get(ingredientInfo.id) || 0;
        deductionMap.set(ingredientInfo.id, currentDeduction + deductionInBaseUnits);
      }
    }

    if (deductionMap.size === 0) return; // Không có gì để trừ, kết thúc.

    // === BƯỚC 3: THỰC THI VÀO CSDL ===
    // Chuẩn bị dữ liệu để cập nhật hàng loạt.
    const stockUpdatePromises: any[] = [];
    const receiptDetailsPayload: { ingredient_id: string; quantity: number; }[] = [];

    for (const [ingredientId, totalDeduction] of deductionMap.entries()) {
      const ingredientInfo = ingredientsMap.get(ingredientId);
      if (!ingredientInfo) continue;

      const newStock = (ingredientInfo.stock_quantity || 0) - totalDeduction;
      stockUpdatePromises.push(this.client.from('ingredients').update({ stock_quantity: newStock }).eq('id', ingredientId));
      // Lưu số lượng trừ dưới dạng số âm để ghi vào lịch sử.
      receiptDetailsPayload.push({ ingredient_id: ingredientId, quantity: -totalDeduction });
    }

    // 3.1. Tạo một phiếu xuất kho.
    const { data: receiptData, error: receiptError } = await this.client.from('inventory_receipts').insert({ receipt_type: 'SALE_DEDUCTION' }).select('id').single();
    if (receiptError) {
      this.logger.error(`Lỗi tạo phiếu xuất kho cho đơn ${orderId}:`, receiptError);
      throw new InternalServerErrorException('Không thể tạo phiếu xuất kho.');
    }

    // 3.2. Ghi chi tiết các nguyên liệu đã bị trừ vào phiếu xuất.
    const finalReceiptDetails = receiptDetailsPayload.map(detail => ({ ...detail, receipt_id: receiptData.id }));
    await this.client.from('receipt_details').insert(finalReceiptDetails);

    // 3.3. Cập nhật lại số lượng tồn kho của các nguyên liệu.
    await Promise.all(stockUpdatePromises);

    this.logger.log(`Trừ kho và ghi nhận phiếu xuất kho thành công cho đơn hàng ${orderId}.`);
  }
}