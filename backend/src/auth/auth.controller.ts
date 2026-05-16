import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: Record<string, any>) {
    // Thực tế nên dùng class DTO + class-validator
    return this.authService.register(body.email, body.password, body.fullName);
  }

  @Post('login')
  async login(@Body() body: Record<string, any>) {
    return this.authService.login(body.email, body.password);
  }
}