"use client";
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'purple' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'slate' | 'pink' | 'indigo';
  className?: string;
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-800 text-slate-300',
    outline: 'border border-white/10 text-slate-400',
    purple: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    slate: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  };

  return (
    <span className={cn(
      "px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}
