// backend/src/products/products.service.ts

import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class ProductsService {
  private readonly client: SupabaseClient;

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  /**
   * Tái cấu trúc (LẦN CUỐI): Lấy tất cả sản phẩm KÈM THEO công thức và các chi tiết cần thiết.
   * Câu lệnh này bây giờ sẽ hoạt động vì khóa ngoại đã được dọn dẹp.
   */
  async findAllWithDetails() {
    const { data, error } = await this.client
      .from('products')
      .select(
        `
        id, name, price, image_url, is_active, category_id,
        categories ( name ),
        recipes (
          quantity,
          ingredients ( name, recipe_unit )
        )
      `,
      )
      .order('name', { ascending: true });

    if (error) {
      console.error('Lỗi khi thực thi findAllWithDetails:', error);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  /**
   * Tái cấu trúc: Lấy một sản phẩm bằng ID kèm theo công thức.
   */
  async findOneWithDetails(id: string) {
    const { data, error } = await this.client
      .from('products')
      .select(
        `
        *,
        recipes (
          ingredient_id,
          quantity
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116')
        throw new NotFoundException(`Không tìm thấy sản phẩm với ID: ${id}`);
      console.error(`Lỗi khi thực thi findOneWithDetails cho ID ${id}:`, error);
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  /**
   * Tái cấu trúc: Tạo sản phẩm và công thức của nó trong một khối logic.
   */
  async createWithRecipe(createProductDto: CreateProductDto) {
    const { ingredients, ...productData } = createProductDto;

    const { data: newProduct, error: productError } = await this.client
      .from('products')
      .insert(productData)
      .select('id')
      .single();

    if (productError) {
      throw new InternalServerErrorException(
        `Lỗi khi tạo sản phẩm: ${productError.message}`,
      );
    }

    if (ingredients && ingredients.length > 0) {
      const recipePayload = ingredients.map((ing) => ({
        product_id: newProduct.id,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity_required,
      }));

      const { error: recipeError } = await this.client
        .from('recipes')
        .insert(recipePayload);

      if (recipeError) {
        await this.client.from('products').delete().eq('id', newProduct.id);
        throw new InternalServerErrorException(
          `Lỗi khi tạo công thức: ${recipeError.message}`,
        );
      }
    }

    return { ...newProduct, ...productData };
  }

  /**
   * Tái cấu trúc: Cập nhật sản phẩm và công thức của nó.
   */
  async updateWithRecipe(id: string, updateProductDto: UpdateProductDto) {
    const { ingredients, ...productData } = updateProductDto;

    const { data: updatedProduct, error: productError } = await this.client
      .from('products')
      .update(productData)
      .eq('id', id)
      .select('id')
      .single();

    if (productError) {
      throw new InternalServerErrorException(
        `Lỗi khi cập nhật sản phẩm: ${productError.message}`,
      );
    }

    const { error: deleteError } = await this.client
      .from('recipes')
      .delete()
      .eq('product_id', id);
    if (deleteError) {
      throw new InternalServerErrorException(
        `Lỗi khi xóa công thức cũ: ${deleteError.message}`,
      );
    }

    if (ingredients && ingredients.length > 0) {
      const recipePayload = ingredients.map((ing) => ({
        product_id: id,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity_required,
      }));

      const { error: recipeError } = await this.client
        .from('recipes')
        .insert(recipePayload);
      if (recipeError) {
        throw new InternalServerErrorException(
          `Lỗi khi cập nhật công thức mới: ${recipeError.message}`,
        );
      }
    }

    return updatedProduct;
  }

  async remove(id: string) {
    const { error } = await this.client.from('products').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        throw new BadRequestException(
          'Không thể xóa sản phẩm này vì nó đã tồn tại trong các đơn hàng hoặc công thức.',
        );
      }
      throw new InternalServerErrorException(error.message);
    }
    return { message: 'Xóa sản phẩm thành công.' };
  }

  async toggleActive(id: string, is_active: boolean) {
    const { data, error } = await this.client
      .from('products')
      .update({ is_active })
      .eq('id', id)
      .select('id, is_active')
      .single();

    if (error) {
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  async uploadImage(file: Express.Multer.File) {
    const fileName = `${Date.now()}-${file.originalname.replace(/\s/g, '-')}`;
    const { data, error } = await this.client.storage
      .from('product-images')
      .upload(fileName, file.buffer, { contentType: file.mimetype });
    if (error)
      throw new InternalServerErrorException(
        'Lỗi khi tải ảnh lên: ' + error.message,
      );
    const { data: urlData } = this.client.storage
      .from('product-images')
      .getPublicUrl(data.path);
    return { imageUrl: urlData.publicUrl };
  }
}
