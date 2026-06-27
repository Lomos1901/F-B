// backend/src/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from './enums/user-role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Tái cấu trúc: Thêm việc đồng bộ email và nhận 'role' từ tham số.
   */
  async register(email: string, password: string, fullName: string, role: UserRole) {
    const publicClient = this.supabaseService.getPublicClient();

    // 1. Tạo user trong schema `auth` của Supabase
    const { data: authData, error: authError } = await publicClient.auth.signUp({
      email,
      password,
    });

    if (authError) {
      this.logger.error('Lỗi khi signUp trên Supabase Auth:', authError);
      throw new BadRequestException(authError.message);
    }
    if (!authData.user) {
      throw new InternalServerErrorException('Không thể tạo user trong Supabase Auth.');
    }

    // 2. Tạo hồ sơ tương ứng trong bảng `public.users`
    const adminClient = this.supabaseService.getAdminClient();
    const { error: dbError } = await adminClient.from('users').insert({
      id: authData.user.id,
      full_name: fullName,
      email: authData.user.email,
      role: role, // Sử dụng role từ tham số
    });

    if (dbError) {
      this.logger.error('Lỗi khi tạo hồ sơ trong public.users:', dbError);
      // Rollback: Xóa user đã tạo bên Auth để tránh user "mồ côi"
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException('Lỗi hệ thống khi khởi tạo hồ sơ nhân viên.');
    }

    return {
      status: 'success',
      message: 'Tài khoản nhân viên đã được khởi tạo thành công!',
    };
  }

  /**
   * Logic đăng nhập không thay đổi nhiều, nhưng cần đảm bảo các trường trả về khớp với frontend.
   */
  async login(email: string, password: string) {
    const publicClient = this.supabaseService.getPublicClient();

    const { data: authData, error: authError } = await publicClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác.');
    }

    const userUuid = authData.user.id;

    // Dùng admin client để đọc thông tin, bỏ qua RLS
    const adminClient = this.supabaseService.getAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('full_name, role')
      .eq('id', userUuid)
      .single();

    if (userError || !userData) {
      throw new UnauthorizedException('Không tìm thấy thông tin cấu hình quyền cho tài khoản này.');
    }

    // Tạo payload cho JWT token tùy chỉnh
    const payload = {
      sub: userUuid,
      email: authData.user.email,
      role: userData.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      status: 'success',
      access_token: accessToken,
      user: {
        id: userUuid,
        email: authData.user.email,
        full_name: userData.full_name,
        role: userData.role,
      },
    };
  }
}