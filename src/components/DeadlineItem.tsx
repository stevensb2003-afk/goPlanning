"use client";
import { Clock } from 'lucide-react';

interface DeadlineItemProps {
  title: string;
  type: string;
  dueDate: string;
  isUrgent?: boolean;
}

export default function DeadlineItem({ title, type, dueDate, isUrgent }: DeadlineItemProps) {
  return (
    <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-white/10">
      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${isUrgent ? 'bg-rose-500 animate-pulse' : 'bg-cyan-500'}`}></div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-white mb-0.5 line-clamp-1 group-hover:text-cyan-400 transition-colors">{title}</h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{type}</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
            <Clock size={10} />
            <span>{dueDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
