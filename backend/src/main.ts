import { NestFactory } from '@nestjs/core'; // <-- Dòng này định nghĩa NestFactory
import { AppModule } from './app.module'; // <-- Dòng này định nghĩa AppModule

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS để bên frontend (Next.js) gọi API không bị chặn
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.enableCors();
  // Đổi thành cổng 3001 để tránh trùng với cổng 3000 của frontend
  await app.listen(3001);
  console.log('🚀 Backend Sẫm Coffee đang chạy tại: http://localhost:3001');
}
bootstrap();
