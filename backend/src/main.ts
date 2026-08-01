import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // Import ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt ValidationPipe trên toàn bộ ứng dụng
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các thuộc tính không có trong DTO
      forbidNonWhitelisted: true, // Ném lỗi nếu có thuộc tính không mong muốn
      transform: true, // Tự động chuyển đổi kiểu dữ liệu (ví dụ: string sang number)
    }),
  );

  // Bật CORS — chỉ cho phép các domain được khai báo trong biến môi trường
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Đổi thành cổng 3001 cho local, hoặc dùng PORT từ biến môi trường khi deploy lên server
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend Lumos Coffee đang chạy tại: http://localhost:${port}`);
}
bootstrap().catch((err) => {
  console.error('Error starting app:', err);
});
