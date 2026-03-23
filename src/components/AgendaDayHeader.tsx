"use client";

interface AgendaDayHeaderProps {
  date: string;
  isToday?: boolean;
}

export default function AgendaDayHeader({ date, isToday }: AgendaDayHeaderProps) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-2 px-1">
      <h5 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-cyan-400' : 'text-slate-500'}`}>
        {date}
      </h5>
      <div className={`flex-1 h-[1px] ${isToday ? 'bg-cyan-500/20' : 'bg-white/5'}`}></div>
    </div>
  );
}
