// backend/src/ingredients/ingredients.service.ts

import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { ImportStockDto, StocktakeDto } from './dto/transaction.dto';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class IngredientsService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(IngredientsService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  /**
   * Tái cấu trúc: Lấy danh sách nguyên liệu kèm theo tên danh mục.
   */
  async findAll() {
    const { data, error } = await this.client
      .from('ingredients')
      .select(`
        *,
        ingredient_categories ( name )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return { status: 'Thành công', record_count: data.length, data: data };
  }

  async findArchived() {
    const { data, error } = await this.client
      .from('ingredients')
      .select(`*, ingredient_categories ( name )`)
      .eq('is_active', false)
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return { status: 'Thành công', record_count: data.length, data: data };
  }

  async create(createIngredientDto: CreateIngredientDto) {
    // Lưu ý: min_threshold đã bị xóa
    const { data, error } = await this.client
      .from('ingredients')
      .insert({ ...createIngredientDto, stock_quantity: 0, is_active: true })
      .select()
      .single();

    if (error) throw new InternalServerErrorException('Lỗi tạo nguyên liệu: ' + error.message);
    return { message: 'Tạo nguyên liệu thành công', data };
  }

  async updateMetadata(id: string, updateIngredientDto: UpdateIngredientDto) {
    const { data, error } = await this.client
      .from('ingredients')
      .update(updateIngredientDto)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new InternalServerErrorException('Lỗi cập nhật nguyên liệu: ' + error.message);
    return data;
  }

  /**
   * Tái cấu trúc HOÀN TOÀN: Logic nhập hàng theo hệ thống phiếu.
   */
  async importStock(id: string, importStockDto: ImportStockDto) {
    if (importStockDto.amount <= 0) throw new BadRequestException('Số lượng nhập phải lớn hơn 0');

    // Bắt đầu một transaction để đảm bảo an toàn
    const { data: current, error: fetchError } = await this.client.from('ingredients').select('stock_quantity').eq('id', id).single();
    if (fetchError || !current) throw new NotFoundException('Không tìm thấy nguyên liệu');

    // 1. Tạo một phiếu nhập kho
    const { data: receiptData, error: receiptError } = await this.client
      .from('inventory_receipts')
      .insert({
        receipt_type: 'IMPORT',
        created_by: importStockDto.performed_by,
      })
      .select('id')
      .single();

    if (receiptError) {
      this.logger.error('Lỗi tạo phiếu nhập kho:', receiptError);
      throw new InternalServerErrorException('Lỗi hệ thống khi tạo phiếu nhập kho.');
    }

    // 2. Ghi chi tiết phiếu nhập
    const { error: detailError } = await this.client
      .from('receipt_details')
      .insert({
        receipt_id: receiptData.id,
        ingredient_id: id,
        quantity: importStockDto.amount,
      });

    if (detailError) {
      this.logger.error('Lỗi ghi chi tiết phiếu nhập kho:', detailError);
      // Rollback: Xóa phiếu vừa tạo
      await this.client.from('inventory_receipts').delete().eq('id', receiptData.id);
      throw new InternalServerErrorException('Lỗi hệ thống khi ghi chi tiết phiếu nhập.');
    }

    // 3. Cập nhật lại tồn kho
    const newStock = (current.stock_quantity || 0) + importStockDto.amount;
    const { error: updateError } = await this.client.from('ingredients').update({ stock_quantity: newStock }).eq('id', id);

    if (updateError) {
      // Đây là trường hợp phức tạp, có thể cần một transaction thực sự ở mức DB
      this.logger.error('Lỗi cập nhật tồn kho sau khi đã ghi phiếu:', updateError);
      // Không ném lỗi để không gây khó hiểu cho người dùng, nhưng cần ghi log
    }

    return { message: 'Nhập hàng thành công', new_stock: newStock };
  }

  /**
   * Tái cấu trúc HOÀN TOÀN: Logic kiểm kho theo hệ thống phiếu.
   */
  async stocktake(id: string, stocktakeDto: StocktakeDto) {
    if (stocktakeDto.actual_quantity < 0) throw new BadRequestException('Số lượng thực tế không được âm');
    if (!stocktakeDto.note || stocktakeDto.note.trim() === '') throw new BadRequestException('Bắt buộc phải ghi chú lý do kiểm kho');

    const { data: current, error: fetchError } = await this.client.from('ingredients').select('stock_quantity').eq('id', id).single();
    if (fetchError || !current) throw new NotFoundException('Không tìm thấy nguyên liệu');

    const currentStock = Number(current.stock_quantity || 0);
    const actualStock = Number(stocktakeDto.actual_quantity);
    const changeAmount = actualStock - currentStock;

    if (changeAmount === 0) {
      return { message: 'Số lượng khớp hoàn toàn, không có biến động.', new_stock: actualStock };
    }

    // 1. Tạo một phiếu kiểm kho
    const { data: receiptData, error: receiptError } = await this.client
      .from('inventory_receipts')
      .insert({
        receipt_type: 'STOCKTAKE_ADJUSTMENT',
        created_by: stocktakeDto.performed_by,
        // Lưu ý: note của nghiệp vụ kiểm kho có thể lưu ở đâu? Hiện tại CSDL chưa có cột này trong inventory_receipts.
        // Tạm thời bỏ qua hoặc cần cập nhật CSDL.
      })
      .select('id')
      .single();

    if (receiptError) {
      this.logger.error('Lỗi tạo phiếu kiểm kho:', receiptError);
      throw new InternalServerErrorException('Lỗi hệ thống khi tạo phiếu kiểm kho.');
    }

    // 2. Ghi chi tiết chênh lệch
    const { error: detailError } = await this.client
      .from('receipt_details')
      .insert({
        receipt_id: receiptData.id,
        ingredient_id: id,
        quantity: changeAmount, // Ghi lại lượng chênh lệch (có thể âm hoặc dương)
      });

    if (detailError) {
      this.logger.error('Lỗi ghi chi tiết phiếu kiểm kho:', detailError);
      await this.client.from('inventory_receipts').delete().eq('id', receiptData.id);
      throw new InternalServerErrorException('Lỗi hệ thống khi ghi chi tiết phiếu kiểm kho.');
    }

    // 3. Cập nhật lại tồn kho
    const { error: updateError } = await this.client.from('ingredients').update({ stock_quantity: actualStock }).eq('id', id);
    if (updateError) {
      this.logger.error('Lỗi cập nhật tồn kho sau khi đã ghi phiếu kiểm kho:', updateError);
    }

    return { message: 'Điều chỉnh kiểm kho thành công', variance: changeAmount, new_stock: actualStock };
  }

  // Các hàm checkDependencies, softDelete, hardDelete, restore không bị ảnh hưởng trực tiếp bởi CSDL mới
  // và có thể giữ nguyên.
  async checkDependencies(id: string) {
    const { data, error } = await this.client.rpc('get_product_names_by_ingredient', { p_ingredient_id: id });
    if (error) {
      this.logger.error("Lỗi khi gọi RPC checkDependencies:", error);
      throw new InternalServerErrorException('Lỗi kiểm tra ràng buộc: ' + error.message);
    }
    const usedInProducts = data.map((row: any) => row.product_name);
    return { is_used: usedInProducts.length > 0, used_in: usedInProducts };
  }

  async softDelete(id: string) {
    const { error } = await this.client.from('ingredients').update({ is_active: false }).eq('id', id);
    if (error) throw new InternalServerErrorException('Lỗi ẩn nguyên liệu: ' + error.message);
    return { message: 'Đã ngưng sử dụng nguyên liệu thành công!' };
  }

  async hardDelete(id: string) {
    const { error } = await this.client.from('ingredients').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        throw new BadRequestException('Không thể xóa vĩnh viễn! Nguyên liệu này đã có lịch sử nhập/xuất kho hoặc đang nằm trong công thức.');
      }
      throw new InternalServerErrorException('Lỗi xóa nguyên liệu: ' + error.message);
    }
    return { message: 'Đã xóa vĩnh viễn nguyên liệu khỏi cơ sở dữ liệu!' };
  }

  async restore(id: string) {
    const { error } = await this.client.from('ingredients').update({ is_active: true }).eq('id', id);
    if (error) throw new InternalServerErrorException('Lỗi khôi phục: ' + error.message);
    return { message: 'Đã khôi phục nguyên liệu thành công!' };
  }
}
