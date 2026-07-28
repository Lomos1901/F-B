import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  async findAll() {
    const { data, error } = await this.client
      .from('users')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException(
        'Không thể lấy danh sách người dùng.',
      );
    }

    return data;
  }

  async create(createUserDto: CreateUserDto) {
    const { email, password, fullName, role } = createUserDto;

    const { data: authData, error: authError } =
      await this.client.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      this.logger.error(
        'Lỗi khi tạo user trong Supabase Auth (Admin):',
        authError,
      );
      throw new BadRequestException(authError.message);
    }
    if (!authData.user) {
      throw new InternalServerErrorException(
        'Không thể tạo user trong Supabase Auth.',
      );
    }

    const { error: dbError } = await this.client.from('users').insert({
      id: authData.user.id,
      full_name: fullName,
      email: email,
      role: role,
    });

    if (dbError) {
      this.logger.error('Lỗi khi tạo hồ sơ trong public.users:', dbError);
      await this.client.auth.admin.deleteUser(authData.user.id);
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi khởi tạo hồ sơ nhân viên.',
      );
    }

    return {
      message: 'Tạo tài khoản nhân viên thành công!',
      userId: authData.user.id,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...dbUpdates } = updateUserDto;

    // Update password in Supabase Auth if provided
    if (password) {
      const { error: authError } = await this.client.auth.admin.updateUserById(id, {
        password: password
      });
      if (authError) {
        this.logger.error(`Lỗi cập nhật mật khẩu cho user ${id}:`, authError);
        throw new InternalServerErrorException('Lỗi khi cập nhật mật khẩu.');
      }
    }

    if (Object.keys(dbUpdates).length === 0) {
      return { message: 'Cập nhật thành công!' };
    }

    const { data, error } = await this.client
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error(`Lỗi khi cập nhật user ${id}:`, error);
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Không tìm thấy người dùng để cập nhật.');
      }
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi cập nhật người dùng.',
      );
    }

    return { message: 'Cập nhật thông tin người dùng thành công!', user: data };
  }

  async remove(id: string) {
    const { error } = await this.client.auth.admin.deleteUser(id);

    if (error) {
      this.logger.error(`Lỗi khi xóa user ${id}:`, error);
      if (error.message.includes('not found')) {
        throw new NotFoundException('Không tìm thấy người dùng để xóa.');
      }
      throw new InternalServerErrorException(
        'Lỗi hệ thống khi xóa người dùng.',
      );
    }

    return { message: 'Xóa người dùng thành công!' };
  }
}
