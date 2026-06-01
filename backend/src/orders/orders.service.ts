import { Injectable, InternalServerErrorException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SupabaseClient } from '@supabase/supabase-js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

interface LogEntry {
  ingredient_id: string;
  change_amount: number;
  action_type: string;
  note: string;
}

@Injectable()
export class OrdersService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  // ... (các hàm khác không đổi)
  async create(createOrderDto: CreateOrderDto) {
    const { table_number, items } = createOrderDto;
    const totalPrice = items.reduce((sum, item) => sum + item.price_at_order * item.quantity, 0);
    const { data: orderData, error: orderError } = await this.client.from('orders').insert({ table_number, total_price: totalPrice, status: 'PENDING' }).select('id').single();
    if (orderError) throw new InternalServerErrorException(`Lỗi khi tạo đơn hàng: ${orderError.message}`);
    const newOrderId = orderData.id;
    const orderItemsData = items.map(item => ({ order_id: newOrderId, product_id: item.product_id, quantity: item.quantity, unit_price: item.price_at_order }));
    const { error: itemsError } = await this.client.from('order_items').insert(orderItemsData);
    if (itemsError) {
      await this.client.from('orders').delete().eq('id', newOrderId);
      throw new InternalServerErrorException(`Lỗi khi thêm các món vào đơn hàng: ${itemsError.message}`);
    }
    return { message: `Đơn hàng cho bàn ${table_number} đã được ghi nhận thành công!`, orderId: newOrderId };
  }

  async getOrdersByStatus(status: string) {
    const { data, error } = await this.client.from('orders').select(`*, order_items (quantity, unit_price, products ( name ))`).eq('status', status.toUpperCase()).order('created_at', { ascending: true });
    if (error) throw new InternalServerErrorException(`Lỗi khi lấy danh sách đơn hàng: ${error.message}`);
    return data;
  }

  async getOpenOrderByTable(tableNumber: string) {
    const { data, error } = await this.client.from('orders').select(`*, order_items (quantity, unit_price, products ( name ))`).eq('table_number', tableNumber).in('status', ['PENDING', 'PREPARING', 'COMPLETED']).order('created_at', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') return null;
    if (error) throw new InternalServerErrorException(`Lỗi dữ liệu: Bàn ${tableNumber} có nhiều hơn 1 đơn hàng chưa thanh toán.`);
    return data;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const newStatus = updateOrderStatusDto.status.toUpperCase();
    const { data, error } = await this.client.from('orders').update({ status: newStatus }).eq('id', id).select().single();
    if (error) throw new InternalServerErrorException(`Lỗi khi cập nhật trạng thái đơn hàng: ${error.message}`);

    if (newStatus === 'PAID') {
      this.logger.log(`Đơn hàng ${id} đã thanh toán. Bắt đầu trừ kho...`);
      this.deductStockForOrder(id).catch(e => {
        this.logger.error(`LỖI TRỪ KHO NGẦM cho đơn hàng ${id}:`, e.stack);
      });
    }
    return data;
  }

  private async deductStockForOrder(orderId: string) {
    this.logger.log(`[DEDUCT STOCK] Bắt đầu hàm deductStockForOrder cho đơn hàng: ${orderId}`);
    const { data: orderItems, error: itemsError } = await this.client.from('order_items').select('quantity, product_id').eq('order_id', orderId);
    if (itemsError) throw new Error(`Không thể lấy chi tiết đơn hàng: ${itemsError.message}`);
    if (!orderItems) return;

    const productIds = orderItems.map(item => item.product_id);
    const { data: recipes, error: recipesError } = await this.client.from('recipes').select('product_id, ingredient_id, quantity').in('product_id', productIds);
    if (recipesError) throw new Error(`Không thể lấy công thức: ${recipesError.message}`);

    // Lấy tất cả thông tin nguyên liệu cần thiết trong 1 lần gọi
    const ingredientIds = [...new Set(recipes.map(r => r.ingredient_id))];
    const { data: ingredients, error: ingredientsError } = await this.client.from('ingredients').select('id, name, conversion_factor').in('id', ingredientIds);
    if(ingredientsError) throw new Error(`Không thể lấy thông tin nguyên liệu: ${ingredientsError.message}`);

    // Tạo một Map để tra cứu thông tin nguyên liệu nhanh chóng
    const ingredientsMap = new Map(ingredients.map(i => [i.id, i]));

    const deductionMap = new Map<string, number>();
    this.logger.log('[DEDUCT STOCK] Bắt đầu vòng lặp tính toán trừ kho...');
    for (const item of orderItems) {
      const itemRecipes = recipes.filter(r => r.product_id === item.product_id);
      for (const recipe of itemRecipes) {
        const ingredientInfo = ingredientsMap.get(recipe.ingredient_id);
        if (!ingredientInfo) continue;

        this.logger.log(`-- Đang xử lý công thức cho nguyên liệu: ${ingredientInfo.name}`);
        const conversionFactor = ingredientInfo.conversion_factor || 1;
        const deductionInRecipeUnits = (recipe.quantity || 0) * (item.quantity || 0);
        const deductionInBaseUnits = deductionInRecipeUnits / conversionFactor;

        this.logger.log(`   - Số lượng bán (item.quantity): ${item.quantity}`);
        this.logger.log(`   - Lượng dùng/món (recipe.quantity): ${recipe.quantity}`);
        this.logger.log(`   - Tổng lượng dùng (recipe_unit): ${deductionInRecipeUnits}`);
        this.logger.log(`   - Hệ số quy đổi (conversionFactor): ${conversionFactor}`);
        this.logger.log(`   - Lượng trừ kho (base_unit): ${deductionInRecipeUnits} / ${conversionFactor} = ${deductionInBaseUnits}`);

        const currentDeduction = deductionMap.get(recipe.ingredient_id) || 0;
        deductionMap.set(recipe.ingredient_id, currentDeduction + deductionInBaseUnits);
      }
    }
    this.logger.log('[DEDUCT STOCK] Kết quả tính toán (deductionMap):', deductionMap);

    const logEntries: LogEntry[] = [];
    for (const [ingredientId, totalDeductionInBaseUnits] of deductionMap.entries()) {
      if (totalDeductionInBaseUnits <= 0) continue;

      this.logger.log(`-- Chuẩn bị cập nhật kho cho Ingredient ID: ${ingredientId}`);
      this.logger.log(`   - Tổng lượng trừ (base_unit): ${totalDeductionInBaseUnits}`);

      const { data: currentIngredient, error: fetchError } = await this.client.from('ingredients').select('stock_quantity').eq('id', ingredientId).single();
      if (fetchError) {
        this.logger.error(`   - Lỗi: Không thể lấy tồn kho hiện tại. Bỏ qua.`, fetchError.message);
        continue;
      }

      const currentStock = currentIngredient.stock_quantity || 0;
      const newStock = currentStock - totalDeductionInBaseUnits;
      this.logger.log(`   - Tồn kho hiện tại: ${currentStock}. Tồn kho mới sẽ là: ${newStock}`);

      const { error: updateError } = await this.client.from('ingredients').update({ stock_quantity: newStock }).eq('id', ingredientId);
      if (updateError) {
        this.logger.error(`   - Lỗi: Cập nhật tồn kho thất bại. Bỏ qua.`, updateError.message);
        continue;
      }

      logEntries.push({
        ingredient_id: ingredientId,
        change_amount: -totalDeductionInBaseUnits,
        action_type: 'SALE',
        note: `Bán hàng từ đơn ${orderId}`,
      });
    }

    if (logEntries.length > 0) {
      const { error: logError } = await this.client.from('inventory_log').insert(logEntries);
      if (logError) this.logger.error(`[DEDUCT STOCK] Lỗi ghi log bán hàng: ${logError.message}`);
    }

    this.logger.log(`[DEDUCT STOCK] Hoàn tất trừ kho cho đơn hàng ${orderId}`);
  }
}
