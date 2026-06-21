import { SetMetadata } from '@nestjs/common';

/**
 * Key để định danh một API là công khai (public).
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator @Public() dùng để đánh dấu một API không yêu cầu xác thực JWT.
 * Bất kỳ API nào có decorator này sẽ được JwtAuthGuard bỏ qua.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
