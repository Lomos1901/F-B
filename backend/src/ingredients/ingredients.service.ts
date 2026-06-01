import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { ImportStockDto, StocktakeDto } from './dto/transaction.dto';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class IngredientsService {
  private readonly client: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  async findAll() {
    const { data, error } = await this.client
      .from('ingredients')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return { status: 'Thành công', record_count: data.length, data: data };
  }

  async findArchived() {
    const { data, error } = await this.client
      .from('ingredients')
      .select('*')
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

  async restore(id: string) {
    const { error } = await this.client
      .from('ingredients')
      .update({ is_active: true })
      .eq('id', id);
    if (error) throw new InternalServerErrorException('Lỗi khôi phục: ' + error.message);
    return { message: 'Đã khôi phục nguyên liệu thành công!' };
  }

  async importStock(id: string, importStockDto: ImportStockDto) {
    if (importStockDto.amount <= 0) throw new BadRequestException('Số lượng nhập phải lớn hơn 0');

    const { data: current, error: fetchError } = await this.client
      .from('ingredients')
      .select('stock_quantity')
      .eq('id', id)
      .single();
    if (fetchError || !current) throw new NotFoundException('Không tìm thấy nguyên liệu');

    const newStock = Number(current.stock_quantity || 0) + Number(importStockDto.amount);
    const [updateRes, logRes] = await Promise.all([
      this.client.from('ingredients').update({ stock_quantity: newStock }).eq('id', id),
      this.client.from('inventory_log').insert({
        ingredient_id: id,
        change_amount: importStockDto.amount,
        action_type: 'IMPORT',
        note: importStockDto.note,
        performed_by: importStockDto.performed_by,
      }),
    ]);

    if (updateRes.error) throw new InternalServerErrorException('Lỗi cập nhật tồn kho');
    if (logRes.error) throw new InternalServerErrorException('Lỗi ghi lịch sử nhập hàng');
    return { message: 'Nhập hàng thành công', new_stock: newStock };
  }

  async stocktake(id: string, stocktakeDto: StocktakeDto) {
    if (stocktakeDto.actual_quantity < 0) throw new BadRequestException('Số lượng thực tế không được âm');
    if (!stocktakeDto.note || stocktakeDto.note.trim() === '') throw new BadRequestException('Bắt buộc phải ghi chú lý do');

    const { data: current, error: fetchError } = await this.client
      .from('ingredients')
      .select('stock_quantity')
      .eq('id', id)
      .single();
    if (fetchError || !current) throw new NotFoundException('Không tìm thấy nguyên liệu');

    const currentStock = Number(current.stock_quantity || 0);
    const actualStock = Number(stocktakeDto.actual_quantity);
    const changeAmount = actualStock - currentStock;

    if (changeAmount === 0) return { message: 'Số lượng khớp hoàn toàn, không có biến động.', new_stock: actualStock };

    const [updateRes, logRes] = await Promise.all([
      this.client.from('ingredients').update({ stock_quantity: actualStock }).eq('id', id),
      this.client.from('inventory_log').insert({
        ingredient_id: id,
        change_amount: changeAmount,
        action_type: 'KIEM_KE',
        note: stocktakeDto.note,
        performed_by: stocktakeDto.performed_by,
      }),
    ]);

    if (updateRes.error) throw new InternalServerErrorException('Lỗi cập nhật tồn kho');
    if (logRes.error) throw new InternalServerErrorException('Lỗi ghi lịch sử kiểm kho');
    return { message: 'Điều chỉnh kiểm kho thành công', variance: changeAmount, new_stock: actualStock };
  }

  async checkDependencies(id: string) {
    // SỬA LẠI: Gọi hàm RPC thay vì select join ngầm
    const { data, error } = await this.client.rpc('get_product_names_by_ingredient', {
      p_ingredient_id: id,
    });

    if (error) {
      console.error("Lỗi khi gọi RPC checkDependencies:", error);
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
}
