import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

  async createWithRecipe(createProductDto: CreateProductDto) {
    const { ingredients, ...productDetails } = createProductDto;

    const { data: productData, error: productError } = await this.client
      .from('products')
      .insert(productDetails)
      .select()
      .single();

    if (productError) {
      throw new InternalServerErrorException('Lỗi tạo món nước: ' + productError.message);
    }

    const newProductId = productData.id;

    const recipeInserts = ingredients.map((ing) => ({
      product_id: newProductId,
      ingredient_id: ing.ingredient_id,
      quantity: ing.quantity_required,
    }));

    const { error: recipeError } = await this.client.from('recipes').insert(recipeInserts);

    if (recipeError) {
      await this.client.from('products').delete().eq('id', newProductId);
      throw new InternalServerErrorException('Lỗi thiết lập công thức: ' + recipeError.message);
    }

    return { message: 'Đã thêm thành công món nước mới!', product_id: newProductId };
  }

  async uploadImage(file: Express.Multer.File) {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `menu/${fileName}`;

    const { error } = await this.client.storage
      .from('product-images')
      .upload(filePath, file.buffer, { contentType: file.mimetype, upsert: true });

    if (error) {
      throw new InternalServerErrorException('Không thể tải ảnh lên: ' + error.message);
    }

    const { data: publicUrlData } = this.client.storage.from('product-images').getPublicUrl(filePath);
    return { imageUrl: publicUrlData.publicUrl };
  }

  async findAllWithRecipes() {
    const { data, error } = await this.client
      .from('products')
      .select(`id, name, price, image_url, categories (id, name), recipes (id, quantity, ingredients (id, name, base_unit, recipe_unit, conversion_factor))`)
      .order('name', { ascending: true });

    if (error) {
      throw new InternalServerErrorException('Lỗi tải thực đơn: ' + error.message);
    }
    return data;
  }

  async findOneWithRecipes(id: string) {
    const { data, error } = await this.client
      .from('products')
      .select(`*, recipes (id, quantity, ingredient_id, ingredients (id, name, base_unit, recipe_unit, conversion_factor))`)
      .eq('id', id)
      .single();

    if (error) {
      throw new NotFoundException('Không tìm thấy món nước');
    }
    return data;
  }

  async updateWithRecipe(id: string, updateProductDto: UpdateProductDto) {
    const { ingredients, ...productDetails } = updateProductDto;

    const { error: productError } = await this.client
      .from('products')
      .update(productDetails)
      .eq('id', id);

    if (productError) {
      throw new InternalServerErrorException('Lỗi cập nhật món: ' + productError.message);
    }

    const { error: deleteError } = await this.client.from('recipes').delete().eq('product_id', id);

    if (deleteError) {
      throw new InternalServerErrorException('Lỗi xóa công thức cũ: ' + deleteError.message);
    }

    if (ingredients && ingredients.length > 0) {
      const recipeInserts = ingredients.map((ing) => ({
        product_id: id,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity_required,
      }));

      const { error: recipeError } = await this.client.from('recipes').insert(recipeInserts);

      if (recipeError) {
        throw new InternalServerErrorException('Lỗi thêm công thức mới: ' + recipeError.message);
      }
    }

    return { message: 'Cập nhật thành công!' };
  }

  async removeProduct(id: string) {
    const { error: deleteRecipeError } = await this.client.from('recipes').delete().eq('product_id', id);
    if (deleteRecipeError) {
      throw new InternalServerErrorException('Lỗi dọn dẹp công thức: ' + deleteRecipeError.message);
    }

    const { error: deleteProductError } = await this.client.from('products').delete().eq('id', id);
    if (deleteProductError) {
      throw new InternalServerErrorException('Lỗi xóa món nước: ' + deleteProductError.message);
    }

    return { message: 'Đã xóa món nước vĩnh viễn' };
  }
}
