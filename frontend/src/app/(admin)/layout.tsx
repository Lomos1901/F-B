import Sidebar from '../../components/Sidebar';
// Layout giờ đây trở thành Server Component siêu nhẹ và nhanh!
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 font-sans antialiased">
      
    
      <Sidebar />

      {/* VÙNG HIỂN THỊ NỘI DUNG CHÍNH */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fa]">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

    </div>
  );
}