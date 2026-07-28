// backend/src/ingredient-categories/ingredient-categories.service.ts

import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class IngredientCategoriesService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(IngredientCategoriesService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  async findAll() {
    const { data, error } = await this.client
      .from('ingredient_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      this.logger.error('Lỗi khi lấy danh sách danh mục nguyên liệu:', error);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async create(name: string) {
    const { data, error } = await this.client
      .from('ingredient_categories')
      .insert({ name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Lỗi trùng tên
        throw new BadRequestException('Tên danh mục này đã tồn tại.');
      }
      this.logger.error('Lỗi khi tạo danh mục nguyên liệu:', error);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async update(id: string, name: string) {
    const { data, error } = await this.client
      .from('ingredient_categories')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Tên danh mục này đã tồn tại.');
      }
      this.logger.error(`Lỗi khi cập nhật danh mục ID ${id}:`, error);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async remove(id: string) {
    const { error } = await this.client
      .from('ingredient_categories')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503') {
        // Lỗi khóa ngoại
        throw new BadRequestException(
          'Không thể xóa danh mục này vì vẫn còn nguyên liệu thuộc về nó.',
        );
      }
      this.logger.error(`Lỗi khi xóa danh mục ID ${id}:`, error);
      throw new InternalServerErrorException(error.message);
    }
    return { message: 'Xóa danh mục thành công.' };
  }
}
