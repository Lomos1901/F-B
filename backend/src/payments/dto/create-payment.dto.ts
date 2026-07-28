import { IsNotEmpty, IsNumber, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  order_id: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  payment_method_code: string;

  @IsOptional()
  @IsString()
  note?: string;
}
