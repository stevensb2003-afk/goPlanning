"use client";
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile, loading } = useAuth();
  const { isSidebarOpen, closeSidebar } = useUI();

  // Pages that DON'T have the sidebar/header
  const isAuthPage = pathname === '/login' || pathname === '/onboarding';
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If it's an auth page, just render children directly
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If not logged in and not an auth page, don't render layout yet 
  // (AuthContext will redirect)
  if (!profile) {
    return null;
  }

  // Common layout for all dashboard pages
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50 relative">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
