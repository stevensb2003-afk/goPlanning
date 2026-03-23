import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, User, ExternalLink, X } from 'lucide-react';
import { Task, Project } from '@/lib/services/projectService';
import { UserProfile } from '@/lib/services/userService';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Badge from './Badge';

interface CalendarGridProps {
  tasks: Task[];
  projects: Project[];
  team: UserProfile[];
  viewType: 'month' | '2weeks' | '1week';
}

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
}

function formatDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function CalendarGrid({ tasks, projects, team, viewType }: CalendarGridProps) {
  const router = useRouter();
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedProjectPopup, setSelectedProjectPopup] = useState<Project | null>(null);
  const [popupCoords, setPopupCoords] = useState<{ top: number, left: number } | null>(null);
  const [projectPopupCoords, setProjectPopupCoords] = useState<{ top: number, left: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const projectPopupRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedTask(null);
        setPopupCoords(null); // Keep this for task popup
      }
      if (projectPopupRef.current && !projectPopupRef.current.contains(e.target as Node)) {
        setSelectedProjectPopup(null);
        setProjectPopupCoords(null); // Add this for project popup
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTaskClick = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    let left = rect.left;
    let top = rect.bottom + 8;

    if (left + 280 > window.innerWidth) {
      left = rect.right - 280;
    }
    if (top + 300 > window.innerHeight) {
      top = rect.top - 310;
    }
    
    left = Math.max(20, Math.min(left, window.innerWidth - 300));
    top = Math.max(20, Math.min(top, window.innerHeight - 320));

    setPopupCoords({ top, left });
    setSelectedTask(task);
    setSelectedProjectPopup(null);
  };

  const handleProjectClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    let left = rect.left;
    let top = rect.bottom + 8;

    if (left + 280 > window.innerWidth) {
      left = rect.right - 280;
    }
    if (top + 300 > window.innerHeight) {
      top = rect.top - 310;
    }
    
    left = Math.max(20, Math.min(left, window.innerWidth - 300));
    top = Math.max(20, Math.min(top, window.innerHeight - 320));

    setProjectPopupCoords({ top, left });
    setSelectedProjectPopup(project);
    setSelectedTask(null);
  };

  const handleNavigateToTask = (taskId: string) => {
    router.push(`/tasks?taskId=${taskId}`);
    setSelectedTask(null);
  };

  const handleNavigateToProject = (projectId: string) => {
    router.push(`/tasks?projectId=${projectId}`);
    setSelectedProjectPopup(null);
  };

  const navigate = (direction: 'prev' | 'next') => {
    const nd = new Date(baseDate);
    const sign = direction === 'next' ? 1 : -1;
    if (viewType === 'month') {
      nd.setMonth(nd.getMonth() + (1 * sign));
    } else if (viewType === '2weeks') {
      nd.setDate(nd.getDate() + (14 * sign));
    } else {
      nd.setDate(nd.getDate() + (7 * sign));
    }
    setBaseDate(nd);
  };

  const gridDays = useMemo(() => {
    const days: Date[] = [];
    if (viewType === 'month') {
      const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      const startGrid = getStartOfWeek(startOfMonth);
      // Generate 42 days (6 weeks)
      for (let i = 0; i < 42; i++) {
        const d = new Date(startGrid);
        d.setDate(d.getDate() + i);
        days.push(d);
      }
    } else if (viewType === '2weeks') {
      const startGrid = getStartOfWeek(baseDate);
      for (let i = 0; i < 14; i++) {
        const d = new Date(startGrid);
        d.setDate(d.getDate() + i);
        days.push(d);
      }
    } else {
      const startGrid = getStartOfWeek(baseDate);
      for (let i = 0; i < 7; i++) {
        const d = new Date(startGrid);
        d.setDate(d.getDate() + i);
        days.push(d);
      }
    }
    return days;
  }, [baseDate, viewType]);

  const displayTitle = useMemo(() => {
    if (viewType === 'month') {
      return `${MONTHS[baseDate.getMonth()]} ${baseDate.getFullYear()}`;
    }
    const start = gridDays[0];
    const end = gridDays[gridDays.length - 1];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    }
    return `${start.getDate()} ${MONTHS[start.getMonth()].substring(0,3)} - ${end.getDate()} ${MONTHS[end.getMonth()].substring(0,3)} ${start.getFullYear()}`;
  }, [baseDate, viewType, gridDays]);

  const getProject = (id?: string) => projects.find(p => p.id === id);

  return (
    <div className="glass rounded-3xl p-4 md:p-8 border border-white/5 space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight uppercase truncate">{displayTitle}</h2>

        <div className="flex gap-2">
          <button onClick={() => setBaseDate(new Date())} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">
            HOY
          </button>
          <button onClick={() => navigate('prev')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400 focus:outline-none">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => navigate('next')} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400 focus:outline-none">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/10">
        {DAYS_OF_WEEK.map(day => (
          <div key={day} className="bg-slate-900/50 p-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/10">
            {day}
          </div>
        ))}
        
        {gridDays.map((dateObj, i) => {
          const dateStr = formatDateStr(dateObj);
          const isCurrentMonth = viewType !== 'month' || dateObj.getMonth() === baseDate.getMonth();
          const today = formatDateStr(new Date());
          const isToday = dateStr === today;
          
          const dayTasks = tasks.filter(t => t.dueDate === dateStr);
          
          return (
            <div 
              key={i} 
              className={cn(
                "min-h-[140px] bg-slate-950/40 p-3 flex flex-col gap-2 transition-all hover:bg-white/[0.02] cursor-pointer group",
                !isCurrentMonth && "opacity-40"
              )}
            >
              <span className={cn(
                "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all",
                isToday ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30" : isCurrentMonth ? "text-slate-300 group-hover:text-white" : "text-slate-600"
              )}>
                {dateObj.getDate()}
              </span>
              
              <div className="flex flex-wrap gap-1 mb-1">
                {projects.filter(p => {
                  if (!p.startDate || !p.endDate) return false;
                  return dateStr >= p.startDate && dateStr <= p.endDate;
                }).map(proj => (
                  <button 
                    key={proj.id}
                    onClick={(e) => handleProjectClick(e, proj)}
                    className={cn(
                      "h-2 w-full min-w-[10px] rounded-full opacity-60 hover:opacity-100 hover:scale-y-110 transition-all cursor-pointer",
                      dateStr === proj.startDate && "rounded-l-full",
                      dateStr === proj.endDate && "rounded-r-full"
                    )}
                    style={{ backgroundColor: proj.color }}
                    title={`Proyecto: ${proj.title}`}
                  />
                ))}
              </div>

              <div className="space-y-1.5 overflow-hidden flex-1 scrollbar-subtle max-h-[150px] overflow-y-auto">
                {dayTasks.map((task) => {
                  const proj = getProject(task.projectId);
                  const color = proj?.color || '#A855F7';
                  
                  return (
                    <div 
                      key={task.id} 
                      onClick={(e) => handleTaskClick(e, task)}
                      className={cn(
                        "truncate px-2 flex items-center gap-1.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-tight transition-all hover:scale-[1.02]",
                        selectedTask?.id === task.id && "ring-2 ring-white/20 shadow-lg"
                      )}
                      style={{ 
                        backgroundColor: `${color}15`,
                        color: color,
                        border: `1px solid ${color}30`
                      }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate flex-1">{task.title}</span>
                      {task.status === 'done' && <span className="text-[8px]">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* TASK DETAIL POPUP (RENDERED VIA PORTAL) */}
      {mounted && selectedTask && popupCoords && createPortal(
        <div 
          ref={popupRef}
          className="fixed z-[9999] w-[280px] glass rounded-2xl border border-white/10 shadow-2xl p-4 animate-in fade-in zoom-in duration-200"
          style={{ 
            top: `${popupCoords.top}px`,
            left: `${popupCoords.left}px`
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getProject(selectedTask.projectId)?.color || '#6366f1' }} 
              />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[180px]">
                {getProject(selectedTask.projectId)?.title || 'Sin Proyecto'}
              </span>
            </div>
            <button 
              onClick={() => setSelectedTask(null)}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <button 
            onClick={() => handleNavigateToTask(selectedTask.id!)}
            className="text-left w-full group"
          >
            <h3 className="text-white font-bold text-sm leading-tight mb-3 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
              {selectedTask.title}
              <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
          </button>

          <div className="space-y-4">
            {selectedTask.link && (
              <a 
                href={selectedTask.link.startsWith('http') ? selectedTask.link : `https://${selectedTask.link}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all group mb-2"
              >
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform">
                  <ExternalLink size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest mb-0.5">Enlace Externo</p>
                  <p className="text-[11px] font-bold text-slate-200 truncate">{selectedTask.link}</p>
                </div>
              </a>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Responsable</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">
                  {team.find(u => u.uid === selectedTask.assignedTo?.[0])?.fullName?.split(' ')[0] || 'Sin asignar'}
                </span>
                {team.find(u => u.uid === selectedTask.assignedTo?.[0])?.photoURL ? (
                  <img 
                    src={team.find(u => u.uid === selectedTask.assignedTo?.[0])?.photoURL || ''} 
                    className="w-5 h-5 rounded-full object-cover" 
                    alt="" 
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <User size={10} className="text-slate-500" />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</span>
              <span className="text-xs text-slate-300 capitalize">
                {selectedTask.type === 'diseno' ? 'Diseño' : 
                 selectedTask.type === 'video' ? 'Video' :
                 selectedTask.type === 'social' ? 'Social Media' :
                 selectedTask.type === 'foto' ? 'Fotografía' :
                 selectedTask.type === 'otro' ? 'Otro' : selectedTask.type}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado</span>
              {(() => {
                const statusMap: Record<string, { label: string, variant: "slate" | "cyan" | "emerald" | "amber" | "rose" }> = {
                  'todo': { label: 'Pendiente', variant: 'slate' },
                  'in-progress': { label: 'En Progreso', variant: 'cyan' },
                  'done': { label: 'Completado', variant: 'emerald' },
                  'frozen': { label: 'Congelado', variant: 'amber' },
                  'canceled': { label: 'Cancelado', variant: 'rose' },
                };
                const config = statusMap[selectedTask.status] || { label: selectedTask.status, variant: 'slate' };
                return (
                  <Badge variant={config.variant}>
                    {config.label}
                  </Badge>
                );
              })()}
            </div>

            <div className="pt-4 border-t border-white/5">
              <button 
                onClick={() => handleNavigateToTask(selectedTask.id!)}
                className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-cyan-400 text-[10px] font-bold uppercase tracking-widest transition-all"
              >
                Ver Detalles Completos
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {mounted && selectedProjectPopup && projectPopupCoords && createPortal(
        <div 
          ref={projectPopupRef}
          className="fixed z-[9999] w-[300px] glass rounded-2xl border border-white/10 shadow-2xl p-5 animate-in fade-in zoom-in duration-200"
          style={{ 
            top: `${projectPopupCoords.top}px`,
            left: `${projectPopupCoords.left}px`
          }}
        >
          <div className="flex justify-between items-start mb-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" 
              style={{ backgroundColor: `${selectedProjectPopup.color}20` }}
            >
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: selectedProjectPopup.color }} 
              />
            </div>
            <button 
              onClick={() => setSelectedProjectPopup(null)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-white tracking-tight leading-tight mb-1">
                {selectedProjectPopup.title}
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Detalles del Proyecto
              </p>
            </div>

            {selectedProjectPopup.description ? (
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {selectedProjectPopup.description}
              </p>
            ) : (
              <p className="text-xs text-slate-600 italic">
                Sin descripción disponible
              </p>
            )}

            <div className="pt-2">
              <button 
                onClick={() => handleNavigateToProject(selectedProjectPopup.id!)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 border border-white/5 hover:border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-white/5 active:scale-95 group shadow-inner"
              >
                <span>Ver Proyecto</span>
                <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
