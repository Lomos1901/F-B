import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class TablesService {
  private readonly client: SupabaseClient;
  private readonly logger = new Logger(TablesService.name);

  constructor(private readonly supabaseService: SupabaseService) {
    this.client = this.supabaseService.getAdminClient();
  }

  async getTables() {
    const { data, error } = await this.client
      .from('tables')
      .select('*')
      .eq('is_active', true)
      .order('zone', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      this.logger.error('Error fetching tables', error);
      // Return hardcoded tables if table doesn't exist yet
      if (error.code === '42P01') {
        return this.getFallbackTables();
      }
      throw new InternalServerErrorException('Lỗi khi tải danh sách bàn');
    }
    return data;
  }

  async getTableStatus() {
    // 1. Get all tables
    const tables = await this.getTables();
    
    // 2. Get active orders (PENDING, PREPARING)
    const { data: statusData, error: statusError } = await this.client
      .from('order_status')
      .select('id, status_name')
      .in('status_name', ['PENDING', 'PREPARING']);
      
    if (statusError || !statusData) {
      return tables.map(t => ({ ...t, status: 'AVAILABLE', activeOrdersCount: 0 }));
    }
    
    const activeStatusIds = statusData.map(s => s.id);
    
    // Filter active orders today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: orders, error: ordersError } = await this.client
      .from('orders')
      .select('id, table_number, total_price, created_at, order_status!inner(status_name)')
      .in('status_id', activeStatusIds)
      .gte('created_at', today.toISOString());
      
    if (ordersError) {
      return tables.map(t => ({ ...t, status: 'AVAILABLE', activeOrdersCount: 0 }));
    }

    // Map table_number to active orders
    return tables.map(table => {
      // Find orders for this table (matching by name or id)
      const tableOrders = orders.filter(o => o.table_number === table.name || o.table_number === table.id);
      
      const getStatus = (os: any) => Array.isArray(os) ? os[0]?.status_name : os?.status_name;
      const isOccupied = tableOrders.some(o => getStatus(o.order_status) === 'PREPARING');
      const isPending = tableOrders.some(o => getStatus(o.order_status) === 'PENDING');
      
      let status = 'AVAILABLE';
      if (isPending) status = 'PENDING';
      else if (isOccupied) status = 'OCCUPIED';
      
      return {
        ...table,
        status,
        activeOrdersCount: tableOrders.length,
        totalAmount: tableOrders.reduce((sum, o) => sum + (o.total_price || 0), 0),
        earliestOrderTime: tableOrders.length > 0 ? Math.min(...tableOrders.map(o => new Date(o.created_at).getTime())) : null
      };
    });
  }

  private getFallbackTables() {
    return [
      { id: 't1', name: 'Bàn 1', zone: 'Tầng 1', is_active: true },
      { id: 't2', name: 'Bàn 2', zone: 'Tầng 1', is_active: true },
      { id: 't3', name: 'Bàn 3', zone: 'Tầng 1', is_active: true },
      { id: 't4', name: 'Bàn 4', zone: 'Tầng 1', is_active: true },
      { id: 't5', name: 'Bàn 5', zone: 'Tầng 1', is_active: true },
      { id: 't6', name: 'Bàn 6', zone: 'Tầng 2', is_active: true },
      { id: 't7', name: 'Bàn 7', zone: 'Tầng 2', is_active: true },
      { id: 't8', name: 'Bàn 8', zone: 'Tầng 2', is_active: true },
      { id: 's1', name: 'Sân 1', zone: 'Sân vườn', is_active: true },
      { id: 's2', name: 'Sân 2', zone: 'Sân vườn', is_active: true },
      { id: 's3', name: 'Sân 3', zone: 'Sân vườn', is_active: true }
    ];
  }

  async createTable(data: { name: string; zone: string; is_active?: boolean }) {
    const { data: result, error } = await this.client
      .from('tables')
      .insert([data])
      .select()
      .single();

    if (error) {
      this.logger.error('Error creating table', error);
      throw new InternalServerErrorException('Lỗi khi thêm bàn');
    }
    return result;
  }

  async updateTable(id: string, data: { name?: string; zone?: string; is_active?: boolean }) {
    const { data: result, error } = await this.client
      .from('tables')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Error updating table', error);
      throw new InternalServerErrorException('Lỗi khi cập nhật bàn');
    }
    return result;
  }

  async deleteTable(id: string) {
    const { error } = await this.client
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Error deleting table', error);
      throw new InternalServerErrorException('Lỗi khi xóa bàn');
    }
    return { success: true };
  }
}
