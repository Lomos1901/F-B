import { Controller, Post, Get, Body } from '@nestjs/common'; // 🌟 CHÚ Ý: Đã thêm 'Get' vào mảng import này
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // API GET: Lấy toàn bộ thực đơn kèm công thức chi tiết
  @Get('all-with-recipes')
  async findAllWithRecipes() {
    return this.productsService.findAllWithRecipes();
  }

  // API POST: Thêm món nước mới gộp cấu hình công thức
  @Post('create-with-recipe')
  async createWithRecipe(@Body() createDto: any) {
    return this.productsService.createWithRecipe(createDto);
  }
}