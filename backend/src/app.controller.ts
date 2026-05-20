import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // Để trống, không ghi chữ 'ingredients' vào đây nhé
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
