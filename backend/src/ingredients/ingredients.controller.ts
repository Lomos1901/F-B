import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { IngredientsService } from './ingredients.service';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  // 1. API: Lấy toàn bộ danh sách kho nguyên liệu (Đang hoạt động)
  // GET http://localhost:3001/ingredients
  @Get()
  async getAll() {
    return this.ingredientsService.findAll();
  }

  // 2. API: Lấy danh sách nguyên liệu đã ẩn (Kho lưu trữ)
  // LƯU Ý: Phải đặt trên các Route có param :id để tránh lỗi điều hướng của NestJS
  // GET http://localhost:3001/ingredients/archived
  @Get('archived')
  async getArchived() {
    return this.ingredientsService.findArchived();
  }

  // 3. API: Tạo mới nguyên liệu
  // POST http://localhost:3001/ingredients
  @Post()
  async create(
    @Body()
    body: {
      name: string;
      base_unit: string; // Thay thế unit cũ
      recipe_unit: string; // Thêm mới
      conversion_factor: number; // Thêm mới
      min_threshold: number;
      cost_per_unit: number;
    },
  ) {
    return this.ingredientsService.create(body);
  }

  // 4. API Check sự phụ thuộc trước khi xóa
  // GET http://localhost:3001/ingredients/:id/check-usage
  @Get(':id/check-usage')
  async checkUsage(@Param('id') id: string) {
    return this.ingredientsService.checkDependencies(id);
  }

  // 5. API: Nhập hàng (Cộng thêm số lượng vào kho và sinh Log)
  // POST http://localhost:3001/ingredients/:id/import
  @Post(':id/import')
  async importStock(
    @Param('id') id: string,
    @Body() body: { amount: number; note: string; performed_by?: string },
  ) {
    return this.ingredientsService.importStock(id, body);
  }

  // 6. API: Kiểm kho / Hủy hỏng (Cập nhật tồn kho theo số đếm thực tế và sinh Log độ lệch)
  // POST http://localhost:3001/ingredients/:id/stocktake
  @Post(':id/stocktake')
  async stocktake(
    @Param('id') id: string,
    @Body()
    body: { actual_quantity: number; note: string; performed_by?: string },
  ) {
    return this.ingredientsService.stocktake(id, body);
  }

  // 7. API: Cập nhật thông tin (Tên, Đơn vị, Định mức, Giá vốn) - Tuyệt đối không có sửa số lượng
  // PATCH http://localhost:3001/ingredients/:id
  @Patch(':id')
  async updateMetadata(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      base_unit?: string; // Thay thế unit cũ
      recipe_unit?: string; // Thêm mới
      conversion_factor?: number; // Thêm mới
      min_threshold?: number;
      cost_per_unit?: number;
    },
  ) {
    return this.ingredientsService.updateMetadata(id, body);
  }

  // 8. API: Khôi phục nguyên liệu từ Kho lưu trữ
  // PATCH http://localhost:3001/ingredients/:id/restore
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    return this.ingredientsService.restore(id);
  }

  // 9. API Xóa mềm nguyên liệu
  // DELETE http://localhost:3001/ingredients/:id
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.ingredientsService.softDelete(id);
  }

  // 10. API: Xóa vĩnh viễn nguyên liệu
  // DELETE http://localhost:3001/ingredients/:id/hard
  @Delete(':id/hard')
  async hardRemove(@Param('id') id: string) {
    return this.ingredientsService.hardDelete(id);
  }
}
