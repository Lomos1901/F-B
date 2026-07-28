// backend/src/categories/categories.service.ts

import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class CategoriesService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  /**
   * Lấy tất cả các danh mục.
   * Không có thay đổi lớn, chỉ chuẩn hóa response.
   */
  async findAll() {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Lỗi khi lấy danh sách danh mục:', error);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  /**
   * Tạo một danh mục mới.
   * Không có thay đổi lớn.
   */
  async create(createCategoryDto: CreateCategoryDto) {
    const { data, error } = await this.client
      .from('categories')
      .insert(createCategoryDto)
      .select()
      .single();

    if (error) {
      // Mã '23505' là lỗi unique violation (trùng tên)
      if (error.code === '23505') {
        throw new BadRequestException('Tên danh mục này đã tồn tại.');
      }
      this.logger.error('Lỗi khi tạo danh mục:', error);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  /**
   * Cập nhật một danh mục.
   * Không có thay đổi lớn.
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const { data, error } = await this.client
      .from('categories')
      .update(updateCategoryDto)
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

  /**
   * Xóa một danh mục.
   * Cải tiến: Thêm xử lý lỗi khóa ngoại.
   */
  async remove(id: string) {
    const { error } = await this.client
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      // Mã '23503' là lỗi foreign key violation
      if (error.code === '23503') {
        throw new BadRequestException(
          'Không thể xóa danh mục này vì vẫn còn sản phẩm thuộc về nó.',
        );
      }
      this.logger.error(`Lỗi khi xóa danh mục ID ${id}:`, error);
      throw new InternalServerErrorException(error.message);
    }
    return { message: 'Xóa danh mục thành công.' };
  }
}
