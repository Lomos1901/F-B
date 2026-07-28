import { IsString, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../../auth/enums/user-role.enum';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  password?: string;
}
