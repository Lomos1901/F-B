import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PostgrestResponse } from '@supabase/supabase-js';

@Injectable()
export class RecipesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // 1. Lưu công thức (Recipe) cho một món uống
  async createRecipe(
    productId: string,
    ingredients: { ingredient_id: string; quantity_required: number }[],
  ) {
    const client = this.supabaseService.getAdminClient();

    // Chuẩn bị mảng dữ liệu để insert hàng loạt (Bulk Insert) vào Supabase
    const recipeData = ingredients.map((item) => ({
      product_id: productId,
      ingredient_id: item.ingredient_id,
      quantity_required: item.quantity_required,
    }));

    // Trước khi thêm mới, xóa sạch công thức cũ của món này để tránh trùng lặp nếu chủ quán cập nhật lại
    const { error: deleteError } = await client
      .from('recipes')
      .delete()
      .eq('product_id', productId);

    if (deleteError) {
      throw new InternalServerErrorException(
        'Lỗi làm sạch công thức cũ: ' + deleteError.message,
      );
    }

    // Tiến hành chèn công thức mới vào bảng public.recipes
    const { data, error: insertError } = await client
      .from('recipes')
      .insert(recipeData)
      .select();

    if (insertError) {
      throw new InternalServerErrorException(
        'Không thể lưu công thức món ăn: ' + insertError.message,
      );
    }

    return {
      status: 'success',
      message: 'Cấu hình công thức định lượng món ăn thành công!',
      data,
    };
  }

  // 2. Lấy chi tiết công thức của một món uống (Phục vụ việc hiển thị lên trang quản trị)
  async getRecipeByProduct(productId: string) {
    const client = this.supabaseService.getAdminClient();

    const { data, error }: PostgrestResponse<any> = await client
      .from('recipes')
      .select('id, ingredient_id, quantity_required, ingredients(name, unit)')
      .eq('product_id', productId);

    if (error) {
      throw new InternalServerErrorException(
        'Lỗi lấy công thức món: ' + (error as Error).message,
      );
    }

    return data;
  }
}
