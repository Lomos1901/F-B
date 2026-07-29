import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Định nghĩa tất cả các trang công khai (Whitelist)
  const isPublicPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/qr-order') ||
    pathname === '/';

  // 2. Nếu là trang công khai, cho phép truy cập
  if (isPublicPage) {
    // Xử lý trường hợp đặc biệt: nếu đã đăng nhập thì không cho vào lại trang login/register
    if (token && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Với các trang công khai khác (qr-order, /), cho phép truy cập bình thường
    return NextResponse.next();
  }

  // 3. Nếu không phải trang công khai, nó phải là trang được bảo vệ.
  // Kiểm tra xem người dùng đã đăng nhập chưa.
  if (!token) {
    // Nếu chưa, chuyển hướng về trang đăng nhập.
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname); // Gợi ý: Lưu lại trang họ định vào
    return NextResponse.redirect(loginUrl);
  }

  // Nếu đã đăng nhập, cho phép truy cập trang được bảo vệ.
  return NextResponse.next();
}

// Cấu hình matcher vẫn giữ nguyên
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};