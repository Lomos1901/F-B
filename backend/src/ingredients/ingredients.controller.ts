import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
// Import Guard bảo mật nếu bạn đã dựng sẵn (Ví dụ JwtAuthGuard)
// Nếu chưa viết Guard bảo mật, tạm thời comment dòng dưới lại để chạy thử nghiệm
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Controller('ingredients')
// @UseGuards(JwtAuthGuard) // Kích hoạt dòng này nếu muốn bắt buộc đăng nhập mới gọi được API
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  // API: GET http://localhost:3001/ingredients
  @Get()
  async getAll() {
    return this.ingredientsService.getAllIngredients();
  }

  // API: PATCH http://localhost:3001/ingredients/:id/stock
  @Patch(':id/stock')
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.ingredientsService.updateStock(id, quantity);
  }
}