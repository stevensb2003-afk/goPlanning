"use client";
import { ChevronRight } from 'lucide-react';

interface AgendaItemProps {
  title: string;
  projectTitle?: string;
  color?: string;
  priority?: string;
  onClick?: () => void;
}

export default function AgendaItem({ title, projectTitle, color = '#A855F7', priority, onClick }: AgendaItemProps) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center gap-3 p-2.5 px-3 rounded-xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/10 group relative overflow-hidden"
    >
      {/* Accent Line */}
      <div 
        className="w-1 h-8 rounded-full shrink-0" 
        style={{ backgroundColor: color }}
      ></div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-[13px] font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
            {title}
          </h4>
          {priority === 'high' && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight truncate">
          {projectTitle || 'Sin Proyecto'}
        </p>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ver</span>
        <ChevronRight size={12} className="text-slate-500" />
      </div>
    </div>
  );
}
