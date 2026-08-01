'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Coffee } from 'lucide-react';
import drinkImg from '@/public/drink.jpg';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading, error, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      if (user.role === 'BARISTA') {
        router.push('/kds');
      } else if (user.role === 'CASHIER') {
        router.push('/pos');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  // Đồng bộ React state với autofill của trình duyệt khi F5
  useEffect(() => {
    const timer = setTimeout(() => {
      const emailEl = document.getElementById('email') as HTMLInputElement;
      const passEl = document.getElementById('password') as HTMLInputElement;
      if (emailEl && emailEl.value && emailEl.value !== email) setEmail(emailEl.value);
      if (passEl && passEl.value && passEl.value !== password) setPassword(passEl.value);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    await login(email, password);
  };

  return (
    <main className="min-h-screen flex font-sans text-slate-800 bg-[#FAFAFA]">
      {/* Left Column - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <Image 
          src={drinkImg} 
          alt="Lumos Coffee" 
          fill
          className="object-cover object-center" 
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-[#FAFAFA] pointer-events-none"></div>
        
        <div className="absolute bottom-16 left-16 right-16 z-10">
          <h2 className="text-[40px] font-bold text-white mb-2 tracking-tight drop-shadow-md">LUMOS COFFEE<br/>ELITE</h2>
          <p className="text-white/90 text-lg drop-shadow-md font-medium">Nền tảng quản lý thông minh<br/>Vận hành chuỗi F&B toàn diện</p>
        </div>
      </div>

      {/* Right Column - Form (Material Design 3 Style) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-[440px] bg-white p-10 sm:p-12 rounded-[28px] shadow-sm border border-slate-100">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
             <div className="w-12 h-12 rounded-[16px] bg-[#0B57D0] flex items-center justify-center text-white shadow-sm">
               <Coffee size={24} strokeWidth={2} />
             </div>
             <span className="text-[28px] font-bold tracking-tight text-slate-900">Lumos<span className="text-[#0B57D0]">Coffee</span></span>
          </div>

          <h1 className="text-[32px] leading-tight font-medium text-slate-900 mb-2">Chào mừng trở lại</h1>
          <p className="text-slate-600 mb-10 text-base">Đăng nhập để tiếp tục sử dụng dịch vụ.</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Email Field */}
            <div className="relative">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder=" "
                className="peer w-full h-[56px] px-4 pt-[18px] pb-2 bg-transparent border border-slate-400 text-slate-900 rounded-[4px] focus:border-2 focus:border-[#0B57D0] focus:outline-none transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white]"
              />
              <label 
                htmlFor="email" 
                className="absolute left-4 top-0 -translate-y-1/2 text-xs text-slate-600 bg-white px-1 transition-all pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-[#0B57D0]"
              >
                Email
              </label>
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder=" "
                className="peer w-full h-[56px] px-4 pt-[18px] pb-2 bg-transparent border border-slate-400 text-slate-900 rounded-[4px] focus:border-2 focus:border-[#0B57D0] focus:outline-none transition-all [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_white]"
              />
              <label 
                htmlFor="password" 
                className="absolute left-4 top-0 -translate-y-1/2 text-xs text-slate-600 bg-white px-1 transition-all pointer-events-none peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-500 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-[#0B57D0]"
              >
                Mật khẩu
              </label>
            </div>

            {error && (
              <div className="bg-[#F2B8B5]/20 text-[#B3261E] p-4 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="h-10 px-6 bg-[#0B57D0] text-white font-medium text-sm rounded-full hover:bg-[#0842A0] focus:ring-4 focus:ring-[#0B57D0]/20 disabled:opacity-50 transition-all shadow-sm"
              >
                {loading ? 'Đang tải...' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        </div>
        

      </div>
    </main>
  );
}