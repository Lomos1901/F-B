// src/ingredients/dto/transaction.dto.ts
// File này định nghĩa các "khuôn mẫu" dữ liệu (Data Transfer Objects - DTO)
// cho các giao dịch liên quan đến kho nguyên liệu, như Nhập hàng và Kiểm kho.
// Việc sử dụng DTO giúp xác thực dữ liệu đầu vào một cách tự động và an toàn.

import {
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

/**
 * DTO cho chức năng Nhập hàng (Import Stock).
 * Dùng để xác thực dữ liệu khi người dùng gửi yêu cầu nhập thêm nguyên liệu vào kho.
 */
export class ImportStockDto {
  /**
   * Số lượng nguyên liệu cần nhập thêm.
   * @IsNumber() - Phải là một con số.
   * @IsPositive() - Phải là một số dương (lớn hơn 0).
   */
  @IsNumber({}, { message: 'Số lượng phải là một con số.' })
  @IsPositive({ message: 'Số lượng nhập phải lớn hơn 0.' })
  amount: number;

  /**
   * Ghi chú cho lần nhập hàng (ví dụ: "Nhập hàng từ nhà cung cấp ABC").
   * @IsString() - Phải là một chuỗi ký tự.
   * @IsOptional() - Trường này không bắt buộc phải có.
   */
  @IsString({ message: 'Ghi chú phải là một chuỗi ký tự.' })
  @IsOptional()
  note?: string;

  /**
   * ID của người dùng (nhân viên) thực hiện hành động nhập hàng.
   * @IsUUID() - Phải là một chuỗi UUID hợp lệ.
   */
  @IsUUID('4', { message: 'ID người thực hiện không hợp lệ.' })
  performed_by: string;
}

/**
 * DTO cho chức năng Kiểm kho (Stocktake).
 * Dùng để xác thực dữ liệu khi người dùng cập nhật số lượng tồn kho thực tế.
 */
export class StocktakeDto {
  /**
   * Số lượng thực tế đếm được trong kho.
   * @IsNumber() - Phải là một con số.
   * @Min(0) - Số lượng không được là số âm.
   */
  @IsNumber({}, { message: 'Số lượng thực tế phải là một con số.' })
  @Min(0, { message: 'Số lượng thực tế không được là số âm.' })
  actual_quantity: number;

  /**
   * Ghi chú bắt buộc cho lần kiểm kho, giải thích lý do chênh lệch.
   * @IsString() - Phải là một chuỗi ký tự.
   */
  @IsString({ message: 'Ghi chú phải là một chuỗi ký tự.' })
  note: string;

  /**
   * ID của người dùng (nhân viên) thực hiện hành động kiểm kho.
   * @IsUUID() - Phải là một chuỗi UUID hợp lệ.
   */
  @IsUUID('4', { message: 'ID người thực hiện không hợp lệ.' })
  performed_by: string;
}
