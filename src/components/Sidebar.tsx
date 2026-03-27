"use client";
import Link from 'next/link';
import { LayoutDashboard, Briefcase, Calendar, CheckSquare, Settings, Users, LogOut, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';
import { useMemo } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Briefcase, label: 'Proyectos', href: '/projects' },
  { icon: CheckSquare, label: 'Tareas', href: '/tasks' },
  { icon: Calendar, label: 'Calendario', href: '/calendar' },
  { icon: Users, label: 'Equipo', href: '/team' },
  { icon: Settings, label: 'Ajustes', href: '/settings' },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { profile, logout, isAdmin } = useAuth();
  const { tasks, projects } = useData();

  const pendingApprovalCount = useMemo(() => {
    if (!isAdmin) return 0;
    const activeProjectIds = new Set(projects.map(p => p.id));
    return tasks.filter(t => 
      t.status === 'pending-approval' && 
      (!t.projectId || activeProjectIds.has(t.projectId))
    ).length;
  }, [tasks, projects, isAdmin]);

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || '??';
  };

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-white/10 flex flex-col p-6 transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:flex",
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 premium-gradient rounded-lg shadow-lg flex items-center justify-center font-black text-white">G</div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">GoPlanning</h1>
          </div>
          
          {/* MOBILE CLOSE BUTTON */}
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white md:hidden transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group relative",
                  isActive 
                    ? "bg-white/5 text-cyan-400 font-bold shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                )}
                <Icon size={20} className={cn(isActive ? "text-cyan-400" : "group-hover:text-white transition-colors")} />
                <span className="text-sm tracking-tight">{item.label}</span>
                
                {item.label === 'Tareas' && pendingApprovalCount > 0 && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.8)] animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="px-4 py-4 rounded-2xl bg-slate-900/50 border border-white/5 shadow-inner">
            <div className="flex items-center gap-3">
              <UserAvatar 
                src={profile?.photoURL} 
                name={profile?.fullName || profile?.displayName} 
                size="md" 
                rounded="rounded-full" 
                className="border-2 border-white/5 shadow-lg"
              />
              <div className="min-w-0">
                <p className="text-xs font-black text-white truncate tracking-tight">{profile?.fullName || profile?.displayName || 'Usuario'}</p>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate opacity-60">
                  {profile?.baseRole === 'admin' ? 'Administrador' : profile?.specialty || profile?.baseRole || 'Miembro'}
                </p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
          >
            <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
            <span className="text-xs font-black uppercase tracking-widest">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
