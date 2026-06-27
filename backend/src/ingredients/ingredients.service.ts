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
   * SỬA LỖI: Liệt kê tường minh các cột để đảm bảo dữ liệu đầy đủ.
   */
  async findAll() {
    const { data, error } = await this.client
      .from('ingredients')
      .select(`
        id,
        name,
        stock_quantity,
        base_unit,
        cost_per_unit,
        recipe_unit,
        conversion_factor,
        ingredient_categories ( name )
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      this.logger.error('Lỗi khi thực hiện findAll ingredients:', error);
      throw new InternalServerErrorException(error.message);
    }
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

  async importStock(id: string, importStockDto: ImportStockDto) {
    if (importStockDto.amount <= 0) throw new BadRequestException('Số lượng nhập phải lớn hơn 0');

    const { data: current, error: fetchError } = await this.client.from('ingredients').select('stock_quantity').eq('id', id).single();
    if (fetchError || !current) throw new NotFoundException('Không tìm thấy nguyên liệu');

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

    const { error: detailError } = await this.client
      .from('receipt_details')
      .insert({
        receipt_id: receiptData.id,
        ingredient_id: id,
        quantity: importStockDto.amount,
      });

    if (detailError) {
      this.logger.error('Lỗi ghi chi tiết phiếu nhập kho:', detailError);
      await this.client.from('inventory_receipts').delete().eq('id', receiptData.id);
      throw new InternalServerErrorException('Lỗi hệ thống khi ghi chi tiết phiếu nhập.');
    }

    const newStock = (current.stock_quantity || 0) + importStockDto.amount;
    const { error: updateError } = await this.client.from('ingredients').update({ stock_quantity: newStock }).eq('id', id);

    if (updateError) {
      this.logger.error('Lỗi cập nhật tồn kho sau khi đã ghi phiếu:', updateError);
    }

    return { message: 'Nhập hàng thành công', new_stock: newStock };
  }

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

    const { data: receiptData, error: receiptError } = await this.client
      .from('inventory_receipts')
      .insert({
        receipt_type: 'STOCKTAKE_ADJUSTMENT',
        created_by: stocktakeDto.performed_by,
      })
      .select('id')
      .single();

    if (receiptError) {
      this.logger.error('Lỗi tạo phiếu kiểm kho:', receiptError);
      throw new InternalServerErrorException('Lỗi hệ thống khi tạo phiếu kiểm kho.');
    }

    const { error: detailError } = await this.client
      .from('receipt_details')
      .insert({
        receipt_id: receiptData.id,
        ingredient_id: id,
        quantity: changeAmount,
      });

    if (detailError) {
      this.logger.error('Lỗi ghi chi tiết phiếu kiểm kho:', detailError);
      await this.client.from('inventory_receipts').delete().eq('id', receiptData.id);
      throw new InternalServerErrorException('Lỗi hệ thống khi ghi chi tiết phiếu kiểm kho.');
    }

    const { error: updateError } = await this.client.from('ingredients').update({ stock_quantity: actualStock }).eq('id', id);
    if (updateError) {
      this.logger.error('Lỗi cập nhật tồn kho sau khi đã ghi phiếu kiểm kho:', updateError);
    }

    return { message: 'Điều chỉnh kiểm kho thành công', variance: changeAmount, new_stock: actualStock };
  }

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
    const { error } = await this.client
      .from('ingredients')
      .update({ is_active: false })
      .eq('id', id);
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
    const { error } = await this.client
      .from('ingredients')
      .update({ is_active: true })
      .eq('id', id);
    if (error) throw new InternalServerErrorException('Lỗi khôi phục: ' + error.message);
    return { message: 'Đã khôi phục nguyên liệu thành công!' };
  }
}