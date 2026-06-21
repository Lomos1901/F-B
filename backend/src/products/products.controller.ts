// backend/src/products/products.controller.ts

import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, ParseUUIDPipe, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard) // Áp dụng Guard cho toàn bộ controller
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Tái cấu trúc: Endpoint để tạo sản phẩm và công thức.
   * Chỉ Manager và Owner có quyền.
   */
  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() createProductDto: CreateProductDto) {
    // Đổi tên hàm gọi service cho đúng
    return this.productsService.createWithRecipe(createProductDto);
  }

  /**
   * Tái cấu trúc: Endpoint để lấy tất cả sản phẩm.
   * Mọi nhân viên đã đăng nhập đều có thể xem.
   */
  @Get()
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.BARISTA, UserRole.CASHIER)
  findAll() {
    // Đổi tên hàm gọi service cho đúng
    return this.productsService.findAllWithDetails();
  }

  /**
   * Tái cấu trúc: Endpoint để lấy một sản phẩm.
   * Mọi nhân viên đã đăng nhập đều có thể xem.
   */
  @Get(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER, UserRole.BARISTA, UserRole.CASHIER)
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    // Đổi tên hàm gọi service cho đúng
    return this.productsService.findOneWithDetails(id);
  }

  /**
   * Tái cấu trúc: Endpoint để cập nhật sản phẩm và công thức.
   * Chỉ Manager và Owner có quyền.
   * Sử dụng PUT vì nó mang ngữ nghĩa "thay thế toàn bộ".
   */
  @Put(':id') // Đổi từ PATCH/PUT sang PUT cho rõ ràng
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
    // Đổi tên hàm gọi service cho đúng
    return this.productsService.updateWithRecipe(id, updateProductDto);
  }

  /**
   * Endpoint để xóa sản phẩm.
   * Chỉ Manager và Owner có quyền.
   */
  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  /**
   * Endpoint để tải ảnh lên.
   * Chỉ Manager và Owner có quyền.
   */
  @Post('upload')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.uploadImage(file);
  }
}
