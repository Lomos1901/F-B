import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Đọc token từ cookie. Đảm bảo lúc login thành công, bạn lưu cookie với tên là 'access_token'
  const token = request.cookies.get("access_token")?.value;

  const pathname = request.nextUrl.pathname;

  // Xác định các trang không cần đăng nhập
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicPage = pathname === "/" || pathname.startsWith("/qr-order");

  // 1. Nếu chưa đăng nhập mà cố vào các trang quản lý (ví dụ: /dashboard, /history) -> Đẩy về /login
  if (!token && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. Nếu đã đăng nhập mà lại vào trang /login hoặc /register -> Đẩy thẳng vào /dashboard
  if (token && isAuthPage) {
    // Đã xóa chữ /(admin) đi, Next.js sẽ tự động hiểu và tìm đúng file bên trong thư mục (admin)
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Cấu hình matcher để middleware chạy trên toàn bộ hệ thống, loại trừ các file tĩnh và API
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
