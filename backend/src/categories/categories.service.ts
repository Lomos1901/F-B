import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // 1. Lấy toàn bộ danh sách danh mục (để đổ vào Sidebar hoặc Dropdown chọn nhóm nước)
  async getAll() {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException('Lỗi lấy danh mục: ' + error.message);
    return data;
  }

  // 2. Thêm một danh mục mới (Ví dụ: Coffee, Trà Sữa)
  async create(name: string, description?: string) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('categories')
      .insert({ name, description })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Mã lỗi trùng Unique tên danh mục trên Postgres
        throw new BadRequestException('Tên danh mục này đã tồn tại trên hệ thống!');
      }
      throw new InternalServerErrorException('Lỗi tạo danh mục: ' + error.message);
    }
    return { status: 'success', message: 'Tạo danh mục thành công!', data };
  }

  // 3. Xóa một danh mục (Hệ thống tự động set NULL các món thuộc danh mục này nhờ ON DELETE SET NULL)
  async delete(id: string) {
    const client = this.supabaseService.getAdminClient();
    const { error } = await client
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException('Lỗi xóa danh mục: ' + error.message);
    return { status: 'success', message: 'Xóa danh mục thành công!' };
  }
}