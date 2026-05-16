import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class IngredientsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // 1. Lấy toàn bộ danh sách nguyên liệu trong kho Sẫm Coffee
  async getAllIngredients() {
    const client = this.supabaseService.getAdminClient();
    
    const { data, error } = await client
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true }); // Sắp xếp theo tên nguyên liệu A-Z

    if (error) {
      throw new InternalServerErrorException('Không thể lấy dữ liệu kho: ' + error.message);
    }

    return data;
  }

  // 2. Cập nhật số lượng tồn kho thực tế (Phục vụ chức năng nhập kho/khấu hao)
  async updateStock(id: string, quantity: number) {
    const client = this.supabaseService.getAdminClient();

    const { data, error } = await client
      .from('ingredients')
      .update({ stock_quantity: quantity, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException('Lỗi cập nhật số lượng tồn kho: ' + error.message);
    }

    if (!data) {
      throw new NotFoundException('Không tìm thấy nguyên liệu yêu cầu');
    }

    return {
      status: 'success',
      message: 'Cập nhật số lượng tồn kho thành công!',
      data,
    };
  }
}