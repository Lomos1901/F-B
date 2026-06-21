import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Ghi đè phương thức canActivate để thêm logic bỏ qua API công khai.
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Lấy metadata 'isPublic' từ decorator @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu API được đánh dấu là công khai, cho phép truy cập mà không cần token.
    if (isPublic) {
      return true;
    }

    // Nếu không, thực hiện quy trình xác thực JWT như bình thường.
    return super.canActivate(context);
  }
}
