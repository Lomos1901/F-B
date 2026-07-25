import { createBrowserClient } from '@supabase/ssr';

// Khởi tạo Supabase client cho phía trình duyệt (frontend)
// Các biến môi trường này phải được định nghĩa trong file .env.local
// và có tiền tố NEXT_PUBLIC_
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);