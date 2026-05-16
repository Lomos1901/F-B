import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ProductsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // Hàm xử lý Transaction gộp: Tạo món nước -> Lấy ID tạo luôn định mức công thức
  async createWithRecipe(body: {
    category_id: string;
    name: string;
    price: number;
    ingredients: { ingredient_id: string; quantity_required: number }[];
  }) {
    const client = this.supabaseService.getAdminClient();
    
    // 1. Tạo món nước mới trong bảng public.products
    const { data: productData, error: productError } = await client
      .from('products')
      .insert({
        name: body.name,
        price: body.price,
        category_id: body.category_id
      })
      .select()
      .single();

    if (productError) {
      throw new InternalServerErrorException('Lỗi tạo món nước trên hệ thống: ' + productError.message);
    }

    const newProductId = productData.id;

    // 2. Chuẩn bị mảng dữ liệu để chèn hàng loạt (Bulk Insert) vào bảng recipes
    const recipeInserts = body.ingredients.map(ing => ({
      product_id: newProductId,
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity_required, // Lưu số lượng lớn (kg, lít) đã quy đổi từ FE
    }));

    // 3. Tiến hành chèn công thức định mức
    const { error: recipeError } = await client
      .from('recipes')
      .insert(recipeInserts);

    if (recipeError) {
      // Chữa cháy: Nếu lỗi chèn công thức, rollback xóa món nước vừa tạo để tránh rác DB
      await client.from('products').delete().eq('id', newProductId);
      throw new InternalServerErrorException('Lỗi thiết lập định mức công thức: ' + recipeError.message);
    }

    return {
      status: 'success',
      message: 'Đã thêm thành công món nước mới kèm định mức pha chế!',
      product_id: newProductId
    };
  }
  // Thêm hàm này vào trong class ProductsService
async findAllWithRecipes() {
  const client = this.supabaseService.getAdminClient();

  // Bốc toàn bộ sản phẩm, kèm thông tin danh mục và mảng công thức chi tiết
  const { data, error } = await client
    .from('products')
    .select(`
      id,
      name,
      price,
      categories (id, name),
      recipes (
        id,
        quantity,
        ingredients (id, name, unit)
      )
    `)
    .order('name', { ascending: true });

  if (error) {
    throw new InternalServerErrorException('Lỗi tải danh sách thực đơn: ' + error.message);
  }

  return data;
}
}