import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Sử dụng ConfigService để lấy secret một cách đáng tin cậy
      secretOrKey: configService.get<string>('SUPABASE_JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Không cần truy vấn CSDL vì JWT đã chứa đầy đủ thông tin (sub, email, role).
    // Điều này giúp tăng hiệu suất và tránh lỗi do rate limit.
    if (!payload.sub) {
      return null;
    }
    return payload;
  }
}
