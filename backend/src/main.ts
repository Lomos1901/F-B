import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Import ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt ValidationPipe trên toàn bộ ứng dụng
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Tự động loại bỏ các thuộc tính không có trong DTO
    forbidNonWhitelisted: true, // Ném lỗi nếu có thuộc tính không mong muốn
    transform: true, // Tự động chuyển đổi kiểu dữ liệu (ví dụ: string sang number)
  }));

  // Bật CORS để bên frontend (Next.js) gọi API không bị chặn
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Đổi thành cổng 3001 để tránh trùng với cổng 3000 của frontend
  await app.listen(3001);
  console.log('🚀 Backend Sẫm Coffee đang chạy tại: http://localhost:3001');
}
bootstrap();
