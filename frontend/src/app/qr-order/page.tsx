// src/app/qr-order/page.tsx

import { redirect } from 'next/navigation';

/**
 * Đây là một trang "bắt lỗi".
 * Nếu người dùng truy cập vào /qr-order mà không có số bàn,
 * họ sẽ được tự động chuyển hướng về trang chủ.
 */
export default function QROrderRedirectPage() {
  // Chuyển hướng vĩnh viễn về trang chủ
  redirect('/');

  // Component này sẽ không bao giờ được render ra
  return null;
}