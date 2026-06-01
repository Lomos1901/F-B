import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, fullName: string) {
    // Sử dụng Public Client cho hành động đăng ký
    const client = this.supabaseService.getPublicClient();

    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('Lỗi từ Supabase Auth (signUp):', authError);
      throw new BadRequestException(authError.message);
    }
    if (!authData.user) {
      throw new InternalServerErrorException('Không thể tạo user trong Supabase Auth');
    }

    // Dùng Admin Client để ghi vào public.users, bỏ qua RLS
    const adminClient = this.supabaseService.getAdminClient();
    const { error: dbError } = await adminClient.from('users').insert({
      id: authData.user.id,
      full_name: fullName,
      role: 'BARISTA',
    });

    if (dbError) {
      console.error('Lỗi khi INSERT vào public.users:', dbError);
      await adminClient.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException('Lỗi khởi tạo hồ sơ nhân viên.');
    }

    return {
      status: 'success',
      message: 'Tài khoản nhân viên đã được khởi tạo thành công!',
    };
  }

  async login(email: string, password: string) {
    // Sử dụng Public Client cho hành động đăng nhập
    const client = this.supabaseService.getPublicClient();

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    const userUuid = authData.user.id;

    // Dùng Admin Client để đọc thông tin user, bỏ qua RLS
    const adminClient = this.supabaseService.getAdminClient();
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('full_name, role')
      .eq('id', userUuid)
      .single();

    if (userError || !userData) {
      throw new UnauthorizedException('Không tìm thấy thông tin cấu hình quyền cho tài khoản này');
    }

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
