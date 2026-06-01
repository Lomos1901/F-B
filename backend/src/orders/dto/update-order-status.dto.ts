// src/orders/dto/update-order-status.dto.ts
import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['PENDING', 'PREPARING', 'COMPLETED', 'PAID', 'CANCELLED'])
  status: string;
}
