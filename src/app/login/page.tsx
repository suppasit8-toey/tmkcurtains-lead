'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-5 relative overflow-hidden bg-[#F9FAFB]">
      {/* Softr-style subtle background patterns could go here, but a clean bg is often best */}
      
      <div className="w-full max-w-md relative z-10 animate-fade-in flex flex-col items-center">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Logo className="w-16 h-16 text-blue-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">TMK Curtains</h1>
          <p className="text-sm mt-1 text-gray-500">
            LEAD Management System
          </p>
        </div>

        {/* Card */}
        <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">เข้าสู่ระบบ</h2>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="label">อีเมล</label>
              <input
                type="email"
                className="input-field"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">รหัสผ่าน</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm text-center py-2 px-4 rounded-lg bg-red-50 text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center mt-2 py-2.5 text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="12" />
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-8 text-gray-400">
          © 2024 TMK Curtains. All rights reserved.
        </p>
      </div>
    </div>
  );
}
