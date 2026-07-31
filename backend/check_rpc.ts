import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { SupabaseService } from './src/supabase/supabase.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const supabase = app.get(SupabaseService).getAdminClient();
  
  // Extract RPC definition
  const { data, error } = await supabase.rpc('run_sql', { sql: `
    SELECT prosrc 
    FROM pg_proc 
    WHERE proname = 'get_dashboard_data';
  `});

  if (error) {
    // If run_sql is not available or errors out, we can try querying via pg_proc if allowed,
    // but usually direct pg_proc access is restricted.
    console.log("Error extracting function:", error);
  } else {
    console.log("=== FUNCTION DEFINITION ===");
    console.log(data);
  }

  await app.close();
}

bootstrap();
