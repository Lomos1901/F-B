import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service'; // Chỉnh lại đường dẫn nếu cần

@Injectable()
export class InventoryLogService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAllWithIngredients() {
    const supabase = this.supabaseService.getAdminClient(); // Dùng AdminClient để bypass RLS nếu chỉ dùng nội bộ Admin

    const { data, error } = await supabase
      .from('inventory_log')
      .select(
        `
        id,
        change_amount,
        note,             
        action_type,      
        created_at,
        performed_by,
        ingredients (
          name,
          unit
        )
      `,
      )
      .order('created_at', { ascending: false }); // Sắp xếp mới nhất lên đầu

    if (error) {
      throw new InternalServerErrorException(
        'Lỗi khi lấy lịch sử kho: ' + error.message,
      );
    }

    // Trả thẳng mảng data về, Frontend của bạn đã có sẵn logic Array.isArray(data) để hứng chuẩn xác
    return data;
  }
}
