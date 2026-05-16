import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // 1. Đăng ký tài khoản nhân viên
  async register(email: string, password: string, fullName: string) {
    const client = this.supabaseService.getAdminClient(); // Dùng Admin Client

    // Tạo user trên Supabase Auth
    const { data: authData, error: authError } = await client.auth.signUp({
      email,
      password,
    });

    if (authError) throw new BadRequestException(authError.message);
    if (!authData.user) throw new InternalServerErrorException('Không thể tạo user');

    // SỬA DÒNG 26 THÀNH NHƯ THẾ NÀY:
// Tối ưu hóa: Dùng .upsert() thay vì .insert() để không bị lỗi trùng ID với hàm tự động của Supabase 
    const { error: dbError } = await client.from('users').upsert({
      id: authData.user.id, // Map UUID từ auth.users sang public.users
      full_name: fullName,
      role: 'staff', // Role mặc định của nhân viên quán
    }, {
      onConflict: 'id' // Nếu trùng ID khóa chính thì tiến hành cập nhật/bỏ qua chứ không báo lỗi
    });

    if (dbError) {
      // Nếu lỗi DB thực sự xảy ra, tiến hành rollback xóa user bên Auth
      await client.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException('Lỗi khởi tạo hồ sơ nhân viên: ' + dbError.message);
    }

    return {
      status: 'success',
      message: 'Tài khoản nhân viên đã được khởi tạo thành công!',
    };
  }
  // 2. Đăng nhập
  async login(email: string, password: string) {
    const client = this.supabaseService.getAdminClient();

    const { data: authData, error: authError } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    const userUuid = authData.user.id;

    // Truy vấn thông tin và quyền từ bảng public.users
    const { data: userData, error: userError } = await client
      .from('users')
      .select('full_name, role')
      .eq('id', userUuid)
      .single();

    if (userError || !userData) {
      throw new UnauthorizedException('Không tìm thấy thông tin cấu hình quyền cho tài khoản này');
    }

    return {
      status: 'success',
      token: authData.session.access_token,
      user: {
        id: userUuid,
        email: authData.user.email,
        full_name: userData.full_name,
        role: userData.role,
      },
    };
  }
}