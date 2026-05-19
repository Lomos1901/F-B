import {
  Controller,
  Post,
  Get,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'; // 🌟 Đã thêm các decorator xử lý file
import { FileInterceptor } from '@nestjs/platform-express'; // 🌟 Thư viện chặn file của NestJS
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

  // 🌟 API POST MỚI: Nhận file ảnh từ Frontend gửi lên đám mây Supabase
  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // Bắt file có tên là 'file' từ form-data
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.uploadImage(file);
  }
}
