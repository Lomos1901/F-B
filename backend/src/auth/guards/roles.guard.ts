import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // Không có @Roles decorator, cho qua
    }
    const { user } = context.switchToHttp().getRequest();

    // user object đã được JwtStrategy đính vào và có chứa role
    // Ví dụ: user = { sub: 'user-id', email: '...', role: 'BARISTA' }
    return requiredRoles.some((role) => user.role === role);
  }
}
