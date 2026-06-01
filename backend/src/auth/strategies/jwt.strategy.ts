import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly supabaseService: SupabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.SUPABASE_JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // Khi validate thành công, payload được giải mã từ JWT sẽ được trả về
    // NestJS sẽ tự động đính đối tượng này vào request.user
    // Chúng ta cần lấy thêm 'role' của user từ bảng 'users' của mình
    const { data, error } = await this.supabaseService.getAdminClient()
      .from('users')
      .select('role')
      .eq('id', payload.sub)
      .single();

    if (error || !data) {
      return null; // hoặc throw UnauthorizedException
    }

    return { ...payload, role: data.role };
  }
}
