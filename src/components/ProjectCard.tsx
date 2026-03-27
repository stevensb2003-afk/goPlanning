"use client";
import { MoreVertical, Users, Calendar } from 'lucide-react';
import { formatLocalDate } from '@/lib/dateUtils';
import Badge from './Badge';

interface ProjectCardProps {
  id: string;
  title: string;
  category: string;
  progress: number;
  members: number;
  status: 'active' | 'completed' | 'canceled';
  color: string;
  startDate?: string;
  endDate?: string;
  isDateRange?: boolean;
  onClick?: () => void;
}

export default function ProjectCard({ 
  title, 
  category, 
  progress, 
  members, 
  status, 
  color, 
  startDate,
  endDate,
  isDateRange,
  onClick 
}: ProjectCardProps) {
  const statusConfig = {
    active: { label: 'Activo', variant: 'purple' as const },
    completed: { label: 'Completado', variant: 'emerald' as const },
    canceled: { label: 'Cancelado', variant: 'rose' as const },
  };
  
  const currentStatus = statusConfig[status] || statusConfig.active;

  return (
    <div 
      onClick={onClick}
      className="bg-slate-900/60 md:glass rounded-3xl p-6 hover:translate-y-[-4px] transition-all duration-300 group cursor-pointer border border-white/5 active:scale-[0.98]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg`} style={{ backgroundColor: `${color}20`, color }}>
          <BriefcaseIcon size={24} />
        </div>
        <button className="text-slate-500 hover:text-white transition-colors">
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors uppercase tracking-tight line-clamp-1">{title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-xs text-slate-400 font-medium">{category}</p>
          {(startDate || endDate) && (
            <div className="flex items-center gap-1.5 text-cyan-400/80">
              <Calendar size={12} strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {isDateRange 
                  ? `${formatLocalDate(startDate || '', 'd MMM')} - ${formatLocalDate(endDate || '', 'd MMM')}` 
                  : formatLocalDate(startDate || '', 'd MMM')
                }
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-slate-400">Progreso</span>
            <span className="text-white font-bold">{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full premium-gradient rounded-full transition-all duration-500" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-500" />
            <span className="text-xs text-slate-400 font-semibold">{members} miembros</span>
          </div>
          <Badge variant={currentStatus.variant} className="text-[9px]">
            {currentStatus.label}
          </Badge>
        </div>
      </div>
    </div>
  );
}

function BriefcaseIcon({ size, color }: { size: number, color?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
