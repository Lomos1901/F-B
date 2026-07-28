// backend/src/inventory-receipts/inventory-receipts.service.ts

import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
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
  async findAllWithDetails(startDate?: string, endDate?: string, type?: string) {
    let query = this.client
      .from('inventory_receipts')
      .select(
        `
        id, receipt_type, created_at,
        users ( full_name ),
        receipt_details (
          quantity,
          ingredients ( name, base_unit, recipe_unit, conversion_factor )
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      const endDateTime = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;
      query = query.lte('created_at', endDateTime);
    }
    if (type && type !== 'ALL') {
      query = query.eq('receipt_type', type);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Lỗi khi lấy lịch sử phiếu kho:', error);
      throw new InternalServerErrorException(
        'Không thể lấy lịch sử phiếu kho.',
      );
    }
    return data;
  }
}
