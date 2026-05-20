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

  // 1. Lấy toàn bộ danh sách nguyên liệu (Đã lọc các món bị xóa mềm)
  async findAll() {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('ingredients')
      .select('*')
      .eq('is_active', true) // <-- Bộ lọc đang sử dụng
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);

    // Format trả về đồng bộ với console.log của bạn
    return {
      status: 'Thành công',
      message: 'Đã lấy được dữ liệu từ quán Sẫm Coffee',
      record_count: data.length,
      data: data,
    };
  }

  // 2. Lấy danh sách nguyên liệu đã bị ẩn (Trong kho lưu trữ)
  async findArchived() {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('ingredients')
      .select('*')
      .eq('is_active', false) // <-- Bộ lọc kho lưu trữ
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return {
      status: 'Thành công',
      message: 'Đã lấy dữ liệu kho lưu trữ',
      record_count: data.length,
      data: data,
    };
  }

  // 3. Cập nhật thông tin cơ bản
  async updateMetadata(
    id: string,
    body: {
      name?: string;
      unit?: string;
      min_threshold?: number;
      cost_per_unit?: number;
    },
  ) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('ingredients')
      .update({
        name: body.name,
        unit: body.unit,
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

  // 4. Khôi phục nguyên liệu (Bật lại công tắc is_active)
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

  // 5. Nghiệp vụ: Nhập hàng (Cộng kho & Ghi Log)
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

  // 6. Nghiệp vụ: Kiểm kho thực tế / Hủy hỏng
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

  // 7. API Dò mìn: Kiểm tra xem nguyên liệu có nằm trong công thức nào không
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

  // 8. Nghiệp vụ: Xóa mềm (Tắt công tắc is_active)
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
}
