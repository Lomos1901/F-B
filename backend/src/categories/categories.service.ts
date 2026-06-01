import { Injectable, InternalServerErrorException, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CategoriesService {
  private readonly client: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  async getAll() {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException('Lỗi lấy danh mục: ' + error.message);
    return data;
  }

  async create(createCategoryDto: CreateCategoryDto) {
    const { data, error } = await this.client
      .from('categories')
      .insert(createCategoryDto)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Tên danh mục này đã tồn tại trên hệ thống!');
      }
      throw new InternalServerErrorException('Lỗi tạo danh mục: ' + error.message);
    }
    return data;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { data, error } = await this.client
      .from('categories')
      .update(updateCategoryDto)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST204') { // No rows found
        throw new NotFoundException(`Không tìm thấy danh mục với ID: ${id}`);
      }
      throw new InternalServerErrorException('Lỗi cập nhật danh mục: ' + error.message);
    }
    return data;
  }

  async delete(id: string) {
    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException('Lỗi xóa danh mục: ' + error.message);
    return { message: 'Xóa danh mục thành công!' };
  }
}
