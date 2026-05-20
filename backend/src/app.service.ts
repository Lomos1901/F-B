import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Backend Sẫm Coffee đang chạy ngon lành!';
  }
}
