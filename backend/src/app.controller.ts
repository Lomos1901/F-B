import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// 🌟 Thêm 'ingredients' vào đây để bắt trúng URL từ Frontend
@Controller('ingredients')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<any> {
    // Gọi sang service để lấy cục dữ liệu bọc sẵn cấu trúc thành công
    return this.appService.getHello();
  }
}
