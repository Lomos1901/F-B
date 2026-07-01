// backend/src/inventory-receipts/inventory-receipts.service.ts

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class InventoryReceiptsService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(InventoryReceiptsService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  /**
   * Lấy tất cả các phiếu kho và chi tiết của chúng.
   * SỬA LỖI: Thêm recipe_unit và conversion_factor để frontend có thể tính toán.
   */
  async findAllWithDetails() {
    const { data, error } = await this.client
      .from('inventory_receipts')
      .select(`
        id, receipt_type, created_at,
        users ( full_name ),
        receipt_details (
          quantity,
          ingredients ( name, base_unit, recipe_unit, conversion_factor )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error('Lỗi khi lấy lịch sử phiếu kho:', error);
      throw new InternalServerErrorException('Không thể lấy lịch sử phiếu kho.');
    }
    return data;
  }
}