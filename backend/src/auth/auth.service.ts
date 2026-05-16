import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service'; // 🌟 Đảm bảo đường dẫn này chính xác

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // 1. Hàm đăng ký tài khoản nhân viên
  async register(email: string, password: string, fullName: string) {
    const client = this.supabaseService.getClient();

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) throw new BadRequestException(error.message);
    return {
      status: 'success',
      message: 'Tài khoản nhân viên đã được khởi tạo thành công!',
      user: data.user,
    };
  }

  // 2. Hàm đăng nhập
  async login(email: string, password: string) {
    const client = this.supabaseService.getClient();

    const { data: authData, error: authError } =
      await client.auth.signInWithPassword({
        email,
        password,
      });

    if (authError)
      throw new UnauthorizedException(
        'Tài khoản hoặc mật khẩu không chính xác',
      );

    const userUuid = authData.user?.id;

    // Truy vấn thông tin và quyền từ bảng public.users
    const { data: userData, error: userError } = await client
      .from('users')
      .select('full_name, role')
      .eq('id', userUuid)
      .single();

    if (userError || !userData) {
      throw new UnauthorizedException(
        'Không tìm thấy thông tin cấu hình quyền cho tài khoản này',
      );
    }

    return {
      status: 'success',
      token: authData.session?.access_token,
      user: {
        id: userUuid,
        email: authData.user?.email,
        full_name: userData.full_name,
        role: userData.role,
      },
    };
  }
}
