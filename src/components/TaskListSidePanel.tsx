"use client";
import { X, Clock } from 'lucide-react';
import { Task, Project } from '@/lib/services/projectService';
import { useRouter } from 'next/navigation';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import AgendaItem from '@/components/AgendaItem';
import AgendaDayHeader from '@/components/AgendaDayHeader';

interface TaskListSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projects: Project[];
}

export default function TaskListSidePanel({ isOpen, onClose, tasks, projects }: TaskListSidePanelProps) {
  const router = useRouter();

  // Filter tasks: incomplete only
  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'canceled');

  // Grouping logic for Agenda
  const groupedTasks = activeTasks.reduce((acc: { [key: string]: Task[] }, task) => {
    const dateKey = task.dueDate ? task.dueDate.split('T')[0] : 'Sin Fecha';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {});

  // Sort dates: closest first, "Sin Fecha" last
  const sortedDateKeys = Object.keys(groupedTasks).sort((a, b) => {
    if (a === 'Sin Fecha') return 1;
    if (b === 'Sin Fecha') return -1;
    return a.localeCompare(b);
  });

  const getRelativeDateLabel = (dateStr: string) => {
    if (dateStr === 'Sin Fecha') return 'Sin Fecha';
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, "EEEE, d 'de' MMM", { locale: es });
  };

  return (
    <div 
      className={`h-full bg-slate-950/40 backdrop-blur-3xl border-l border-white/10 transition-all duration-500 ease-in-out overflow-hidden flex flex-col relative ${
        isOpen ? "w-[90vw] md:w-[380px] opacity-100" : "w-0 opacity-0 border-none"
      }`}
    >
      <div className={`w-[380px] h-full flex flex-col transition-transform duration-500 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-950/20">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
              <Clock className="text-purple-400" size={20} />
              Próximas Tareas
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              {activeTasks.length} pendientes en orden
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-subtle custom-calendar-scroll">
          {sortedDateKeys.length > 0 ? (
            sortedDateKeys.map((dateKey) => (
              <div key={dateKey} className="space-y-1">
                <AgendaDayHeader 
                  date={getRelativeDateLabel(dateKey)} 
                  isToday={dateKey !== 'Sin Fecha' && isToday(parseISO(dateKey))} 
                />
                <div className="space-y-1">
                  {groupedTasks[dateKey].map((task) => {
                    const project = projects.find(p => p.id === task.projectId);
                    return (
                      <AgendaItem 
                        key={task.id}
                        title={task.title}
                        projectTitle={project?.title || 'Sin Proyecto'}
                        color={project?.color || '#A855F7'}
                        priority={task.priority}
                        onClick={() => router.push(`/tasks?taskId=${task.id}`)}
                      />
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-20 mt-20">
              <Clock size={48} className="mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">Todo al día</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
