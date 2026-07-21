'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Building2,
  FileText,
  CheckCircle2,
  LogOut,
  Menu,
  X,
  ListTodo,
  Settings,
  MessageSquareText
} from 'lucide-react';
import { useState } from 'react';
import Logo from '@/components/Logo';
import WelcomeScreen from '@/components/WelcomeScreen';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/tasks', label: 'งานของฉัน', icon: ListTodo },
  { href: '/dashboard/organizations', label: 'องค์กร', icon: Building2 },
  { href: '/dashboard/quotations', label: 'ใบเสนอราคา', icon: FileText },
  { href: '/dashboard/orders', label: 'งานเสร็จสิ้น', icon: CheckCircle2 },
  { href: '/dashboard/scripts', label: 'สคริปต์ & โปร', icon: MessageSquareText },
  { href: '/dashboard/settings', label: 'ตั้งค่า', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-dvh flex bg-[#F9FAFB]">
      <WelcomeScreen />
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-64 fixed top-0 left-0 h-full z-40 bg-white border-r border-gray-200"
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Logo className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">TMK Curtains</p>
              <p className="text-xs text-gray-500">LEAD System</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm w-full transition-all duration-200 text-gray-600 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={18} className="text-gray-400 group-hover:text-red-500" />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Mobile Overlay Sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
          <aside
            className="absolute left-0 top-0 h-full w-72 flex flex-col bg-white border-r border-gray-200 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Logo className="w-8 h-8 text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-gray-900 leading-tight">TMK Curtains</p>
                  <p className="text-xs text-gray-500">LEAD System</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 p-4 flex flex-col gap-1.5 overflow-y-auto">
              {navItems.map(({ href, label, icon: Icon }) => {
                const isActive =
                  href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm w-full text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
              >
                <LogOut size={18} />
                ออกจากระบบ
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-dvh">
        {/* Mobile Top Bar */}
        <header
          className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-900 p-1"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-bold text-gray-900">TMK Curtains</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-500 p-1"
          >
            <LogOut size={18} />
          </button>
        </header>

        <div className="flex-1 p-4 md:p-8 pb-20 md:pb-8">{children}</div>

        {/* Mobile Bottom Nav */}
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 safe-bottom bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-center overflow-x-auto hide-scrollbar">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`min-w-[70px] flex-1 flex flex-col items-center gap-1 py-3 transition-all ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-xs font-medium" style={{ fontSize: '10px' }}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
