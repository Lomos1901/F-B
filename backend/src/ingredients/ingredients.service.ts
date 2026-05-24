import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class IngredientsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // 1. Lấy danh sách nguyên liệu đang hoạt động
  async findAll() {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('ingredients')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return { status: 'Thành công', record_count: data.length, data: data };
  }

  // 2. Lấy danh sách kho lưu trữ
  async findArchived() {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('ingredients')
      .select('*')
      .eq('is_active', false)
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return { status: 'Thành công', record_count: data.length, data: data };
  }

  // 3. TẠO MỚI NGUYÊN LIỆU (Đã cập nhật theo logic ERP mới)
  async create(body: {
    name: string;
    base_unit: string; // Cập nhật từ unit
    recipe_unit: string; // Thêm mới
    conversion_factor: number; // Thêm mới
    min_threshold: number;
    cost_per_unit: number;
  }) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('ingredients')
      .insert({
        name: body.name,
        base_unit: body.base_unit,
        recipe_unit: body.recipe_unit,
        conversion_factor: body.conversion_factor,
        min_threshold: body.min_threshold,
        cost_per_unit: body.cost_per_unit,
        stock_quantity: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error)
      throw new InternalServerErrorException(
        'Lỗi tạo nguyên liệu: ' + error.message,
      );
    return { message: 'Tạo nguyên liệu thành công', data };
  }

  // 4. Cập nhật thông tin (Đã cập nhật theo logic ERP mới)
  async updateMetadata(
    id: string,
    body: {
      name?: string;
      base_unit?: string; // Cập nhật từ unit
      recipe_unit?: string; // Thêm mới
      conversion_factor?: number; // Thêm mới
      min_threshold?: number;
      cost_per_unit?: number;
    },
  ) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('ingredients')
      .update({
        name: body.name,
        base_unit: body.base_unit,
        recipe_unit: body.recipe_unit,
        conversion_factor: body.conversion_factor,
        min_threshold: body.min_threshold,
        cost_per_unit: body.cost_per_unit,
      })
      .eq('id', id)
      .select()
      .single();

    if (error)
      throw new InternalServerErrorException(
        'Lỗi cập nhật nguyên liệu: ' + error.message,
      );
    return data;
  }

  // 5. Khôi phục nguyên liệu
  async restore(id: string) {
    const client = this.supabaseService.getAdminClient();
    const { error } = await client
      .from('ingredients')
      .update({ is_active: true })
      .eq('id', id);
    if (error)
      throw new InternalServerErrorException('Lỗi khôi phục: ' + error.message);
    return { message: 'Đã khôi phục nguyên liệu thành công!' };
  }

  // 6. Nhập hàng
  async importStock(
    id: string,
    body: { amount: number; note: string; performed_by?: string },
  ) {
    if (body.amount <= 0)
      throw new BadRequestException('Số lượng nhập phải lớn hơn 0');
    const client = this.supabaseService.getAdminClient();

    const { data: current, error: fetchError } = await client
      .from('ingredients')
      .select('stock_quantity')
      .eq('id', id)
      .single();
    if (fetchError || !current)
      throw new NotFoundException('Không tìm thấy nguyên liệu');

    const newStock = Number(current.stock_quantity || 0) + Number(body.amount);
    const [updateRes, logRes] = await Promise.all([
      client
        .from('ingredients')
        .update({ stock_quantity: newStock })
        .eq('id', id),
      client.from('inventory_log').insert({
        ingredient_id: id,
        change_amount: body.amount,
        action_type: 'IMPORT',
        note: body.note,
        performed_by: body.performed_by,
      }),
    ]);

    if (updateRes.error)
      throw new InternalServerErrorException('Lỗi cập nhật tồn kho');
    if (logRes.error)
      throw new InternalServerErrorException('Lỗi ghi lịch sử nhập hàng');
    return { message: 'Nhập hàng thành công', new_stock: newStock };
  }

  // 7. Kiểm kho
  async stocktake(
    id: string,
    body: { actual_quantity: number; note: string; performed_by?: string },
  ) {
    if (body.actual_quantity < 0)
      throw new BadRequestException('Số lượng thực tế không được âm');
    if (!body.note || body.note.trim() === '')
      throw new BadRequestException('Bắt buộc phải ghi chú lý do');

    const client = this.supabaseService.getAdminClient();
    const { data: current, error: fetchError } = await client
      .from('ingredients')
      .select('stock_quantity')
      .eq('id', id)
      .single();
    if (fetchError || !current)
      throw new NotFoundException('Không tìm thấy nguyên liệu');

    const currentStock = Number(current.stock_quantity || 0);
    const actualStock = Number(body.actual_quantity);
    const changeAmount = actualStock - currentStock;

    if (changeAmount === 0)
      return {
        message: 'Số lượng khớp hoàn toàn, không có biến động.',
        new_stock: actualStock,
      };

    const [updateRes, logRes] = await Promise.all([
      client
        .from('ingredients')
        .update({ stock_quantity: actualStock })
        .eq('id', id),
      client.from('inventory_log').insert({
        ingredient_id: id,
        change_amount: changeAmount,
        action_type: 'KIEM_KE',
        note: body.note,
        performed_by: body.performed_by,
      }),
    ]);

    if (updateRes.error)
      throw new InternalServerErrorException('Lỗi cập nhật tồn kho');
    if (logRes.error)
      throw new InternalServerErrorException('Lỗi ghi lịch sử kiểm kho');
    return {
      message: 'Điều chỉnh kiểm kho thành công',
      variance: changeAmount,
      new_stock: actualStock,
    };
  }

  // 8. Kiểm tra ràng buộc
  async checkDependencies(id: string) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('recipes')
      .select('products(name)')
      .eq('ingredient_id', id);
    if (error)
      throw new InternalServerErrorException(
        'Lỗi kiểm tra ràng buộc: ' + error.message,
      );

    const usedInProducts = data
      .map((row: any) => row.products?.name)
      .filter((name) => name !== undefined);
    return { is_used: usedInProducts.length > 0, used_in: usedInProducts };
  }

  // 9. Xóa mềm
  async softDelete(id: string) {
    const client = this.supabaseService.getAdminClient();
    const { error } = await client
      .from('ingredients')
      .update({ is_active: false })
      .eq('id', id);
    if (error)
      throw new InternalServerErrorException(
        'Lỗi ẩn nguyên liệu: ' + error.message,
      );
    return { message: 'Đã ngưng sử dụng nguyên liệu thành công!' };
  }

  // 10. Xóa vĩnh viễn khỏi Database
  async hardDelete(id: string) {
    const client = this.supabaseService.getAdminClient();

    const { error } = await client.from('ingredients').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        throw new BadRequestException(
          'Không thể xóa vĩnh viễn! Nguyên liệu này đã có lịch sử nhập/xuất kho hoặc đang nằm trong công thức.',
        );
      }
      throw new InternalServerErrorException(
        'Lỗi xóa nguyên liệu: ' + error.message,
      );
    }

    return { message: 'Đã xóa vĩnh viễn nguyên liệu khỏi cơ sở dữ liệu!' };
  }
}
