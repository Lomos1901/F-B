import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Backend Lumos Coffee đang chạy ngon lành!';
  }
}
