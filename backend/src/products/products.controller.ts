// backend/src/products/products.controller.ts

import { Controller, Get, Post, Body, Param, Delete, UseGuards, UseInterceptors, UploadedFile, ParseUUIDPipe, Put } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';

@Controller('products')
// Bỏ Guard ở cấp controller để cho phép truy cập công khai theo mặc định
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Endpoint để tạo sản phẩm và công thức.
   * YÊU CẦU XÁC THỰC: Chỉ Manager và Owner có quyền.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard) // Áp dụng Guard cho từng endpoint cần bảo vệ
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.createWithRecipe(createProductDto);
  }

  /**
   * Endpoint để lấy tất cả sản phẩm.
   * CÔNG KHAI: Cho phép mọi người (cả khách hàng) truy cập.
   */
  @Get()
  findAll() {
    return this.productsService.findAllWithDetails();
  }

  /**
   * Endpoint để lấy một sản phẩm.
   * CÔNG KHAI: Cho phép mọi người truy cập.
   */
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOneWithDetails(id);
  }

  /**
   * Endpoint để cập nhật sản phẩm và công thức.
   * YÊU CẦU XÁC THỰC: Chỉ Manager và Owner có quyền.
   */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.updateWithRecipe(id, updateProductDto);
  }

  /**
   * Endpoint để xóa sản phẩm.
   * YÊU CẦU XÁC THỰC: Chỉ Manager và Owner có quyền.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  /**
   * Endpoint để tải ảnh lên.
   * YÊU CẦU XÁC THỰC: Chỉ Manager và Owner có quyền.
   */
  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.uploadImage(file);
  }
}