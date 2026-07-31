// src/orders/dto/create-order.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price_at_order: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  table_number: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
