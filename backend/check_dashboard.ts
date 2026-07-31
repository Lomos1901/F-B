import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SupabaseService } from './src/supabase/supabase.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const supabase = app.get(SupabaseService).getAdminClient();
  
  // Test RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_dashboard_data', { p_days: 7 });
  console.log("=== RPC get_dashboard_data (7 days) ===");
  console.log(JSON.stringify(rpcData, null, 2));
  console.log("RPC Error:", rpcError);

  // Check recent orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, table_number, created_at, status_id, order_status(status_name)')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log("\n=== 5 RECENT ORDERS ===");
  console.log(JSON.stringify(orders, null, 2));
  console.log("Orders Error:", ordersError);

  await app.close();
}

bootstrap();
