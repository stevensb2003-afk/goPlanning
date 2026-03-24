"use client";
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import ProjectCard from '@/components/ProjectCard';
import DeadlineItem from '@/components/DeadlineItem';
import { projectService, Project, Task } from '@/lib/services/projectService';
import { userService, UserProfile } from '@/lib/services/userService';
import { useUI } from '@/context/UIContext';
import { Menu as MenuIcon, LayoutDashboard, TrendingUp, CheckCircle2, Clock, AlertCircle, Users, Activity, ChevronRight, Calendar, CheckSquare, Target, UserCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import AgendaItem from '@/components/AgendaItem';
import AgendaDayHeader from '@/components/AgendaDayHeader';


interface DashboardStats {
  activeProjectsCount: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  globalProgress: number;
  completedLast7Days: number;
  upcomingDeadlines: Task[];
  activeProjects: Project[];
  activeTasksByCategory: Record<string, number>;
  completedTasksByCategory: Record<string, number>;
  tasksByMember: Record<string, number>;
  lifetimeTasks?: number;
  lifetimeCompleted?: number;
  lifetimeProgress?: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { toggleSidebar } = useUI();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryTaskView, setCategoryTaskView] = useState<'active' | 'completed'>('active');
  const router = useRouter();

  // Grouping logic for Agenda
  const groupedDeadlines = stats?.upcomingDeadlines.reduce((acc: { [key: string]: Task[] }, task) => {
    const dateKey = task.dueDate ? task.dueDate.split('T')[0] : 'Sin Fecha';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(task);
    return acc;
  }, {}) || {};

  const sortedDateKeys = Object.keys(groupedDeadlines).sort((a, b) => {
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardStats, fetchedUsers] = await Promise.all([
          projectService.getDashboardStats(),
          userService.getAllUsers()
        ]);
        setStats(dashboardStats as DashboardStats);
        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
  );

  const firstName = profile?.fullName?.split(' ')[0] || profile?.displayName?.split(' ')[0] || "Invitado";

  // Prepare Category Chart data (Normalized)
  const categoryData = stats ? (categoryTaskView === 'active' ? stats.activeTasksByCategory : stats.completedTasksByCategory) : {};
  const chartCategories = Object.entries(categoryData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxCategoryTasks = chartCategories.length > 0 ? Math.max(...chartCategories.map(c => c[1])) : 1;

  // Prepare Member Chart data
  const chartMembers = stats ? Object.entries(stats.tasksByMember)
    .sort((a, b) => b[1] - a[1])
    .map(([uid, count]) => {
      const user = users.find(u => u.uid === uid);
      return {
        name: user?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || uid,
        count
      };
    })
    .slice(0, 6) : [];
  const maxMemberTasks = chartMembers.length > 0 ? Math.max(...chartMembers.map(m => m.count)) : 1;

  return (
    <main className="flex-1 overflow-y-auto p-8 space-y-8 animate-in fade-in duration-700">
      {/* Welcome & Global Stats */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden shadow-lg active:scale-95 transition-all"
            >
              <MenuIcon size={20} />
            </button>
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-1 md:mb-2 tracking-tight">Hola, {firstName} 👋</h2>
              <p className="text-slate-400 flex items-center gap-2 text-xs md:text-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                Estado Global: <span className="text-cyan-400 font-bold">{stats?.globalProgress || 0}%</span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-3 md:gap-4 w-full md:w-auto">
             <StatCard 
              icon={Activity} 
              label="Volumen" 
              value={stats?.totalTasks?.toString() || "0"} 
              subValue="Total" 
              color="text-amber-400"
              bgColor="bg-amber-500/10"
            />
             <StatCard 
              icon={Clock} 
              label="Activas" 
              value={stats?.pendingTasks?.toString() || "0"} 
              subValue="Pendientes" 
              color="text-purple-400"
              bgColor="bg-purple-500/10"
            />
            <StatCard 
              icon={CheckCircle2} 
              label="Completadas" 
              value={stats?.completedTasks?.toString() || "0"} 
              subValue="Listas" 
              color="text-emerald-400"
              bgColor="bg-emerald-500/10"
            />
            <div className="col-span-1">
              <StatCard 
                icon={Target} 
                label="Progreso" 
                value={`${stats?.globalProgress || 0}%`} 
                subValue="Eficiencia" 
                color="text-cyan-400"
                bgColor="bg-cyan-500/10"
              />
            </div>
          </div>
        </div>

        {/* Quick Navigation / Metrics Grid */}
        <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4">
          <QuickActionLink href="/calendar" icon={Calendar} label="Calendario" description="Entregas" color="border-cyan-500/20 hover:border-cyan-500/50" iconColor="text-cyan-400" />
          <QuickActionLink href="/team" icon={Users} label="Equipo" description={`${users.length} Miembros`} color="border-purple-500/20 hover:border-purple-500/50" iconColor="text-purple-400" />
          <QuickActionLink href="/tasks" icon={CheckCircle2} label="Mis Tareas" description="Gestión" color="border-amber-500/20 hover:border-amber-500/50" iconColor="text-amber-400" />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        {/* Active Projects Grid & Charts */}
        <div className="xl:col-span-2 space-y-8">
          {/* Projects */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white/90 px-2">
              <LayoutDashboard size={20} className="text-purple-500" />
              Proyectos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Active Projects List */}
              <div className="bg-slate-900/60 md:glass rounded-3xl p-5 border border-white/5 flex flex-col h-[260px] relative">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Lista Activa</span>
                  <Link href="/projects" className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1">
                    Ver Todos <ChevronRight size={14} />
                  </Link>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-subtle custom-calendar-scroll space-y-1">
                  {stats?.activeProjects.map((project) => (
                    <div 
                      key={project.id}
                      onClick={() => router.push(`/projects?projectId=${project.id}`)}
                      className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group border border-transparent hover:border-white/10"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: project.color || '#A855F7' }}></div>
                        <span className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                          {project.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-1000"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-black text-slate-500 group-hover:text-white transition-colors">{project.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                        {/* Relocated Execution Status Widget */}
              <div className="bg-slate-900/60 md:glass rounded-3xl p-6 border border-white/5 flex flex-col min-h-[260px] h-auto">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6 text-center">Estado de Ejecución</h4>
                
                <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-8 sm:gap-12 px-2 sm:px-6">
                  {/* Left: Chart Large */}
                  <div className="relative w-32 h-32 sm:w-44 sm:h-44 shrink-0 flex items-center justify-center">
                    {/* Outer Glow Layer */}
                    <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-3xl" />
                    
                    <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="-10 -10 120 120">
                      <circle className="text-white/5" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                      <circle 
                        className="text-cyan-500 transition-all duration-[1.5s] ease-out drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]" 
                        strokeWidth="8" 
                        strokeDasharray={`${(stats?.globalProgress || 0) * 2.82} 282`} 
                        strokeLinecap="round" 
                        stroke="currentColor" 
                        fill="transparent" 
                        r="45" cx="50" cy="50" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0 translate-y-1">
                      <span className="text-2xl sm:text-4xl font-black text-white tracking-tighter leading-none mb-1">
                        {stats?.globalProgress || 0}%
                      </span>
                      <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        TOTAL
                      </span>
                    </div>
                  </div>

                  {/* Right: Stats Stacked */}
                  <div className="flex flex-row sm:flex-col gap-8 sm:gap-6 w-full sm:w-auto justify-center sm:justify-start">
                    <div className="flex flex-col items-center sm:items-start">
                      <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-80 whitespace-nowrap">Total Tareas</span>
                      <span className="text-2xl sm:text-4xl font-black text-white leading-none tracking-tighter">{stats?.totalTasks || 0}</span>
                    </div>
                    <div className="flex flex-col items-center sm:items-start">
                      <span className="text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 opacity-80 whitespace-nowrap">Completado</span>
                      <span className="text-2xl sm:text-4xl font-black text-emerald-400 leading-none tracking-tighter">{stats?.completedTasks || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 md:glass rounded-3xl p-6 md:p-8 border border-white/5 flex flex-col h-full">
              <div className="flex justify-between items-start mb-8">
                <h4 className="text-md font-bold flex items-center gap-2 text-white/80">
                  <Activity size={18} className="text-emerald-400" />
                  Distribución
                </h4>
                <div className="flex bg-slate-950/50 p-1 rounded-lg border border-white/5">
                  <button 
                    onClick={() => setCategoryTaskView('active')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${categoryTaskView === 'active' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    Activas
                  </button>
                  <button 
                    onClick={() => setCategoryTaskView('completed')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${categoryTaskView === 'completed' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-white'}`}
                  >
                    Listas
                  </button>
                </div>
              </div>
              <div className="flex-1 min-h-[220px] flex items-stretch gap-3 px-2">
                {chartCategories.length > 0 ? chartCategories.map(([category, count]) => (
                  <div key={category} className="flex-1 flex flex-col items-center gap-3 group relative h-full">
                    {/* Bar Container (Takes all space above label) */}
                    <div className="flex-1 w-full flex items-end group/bar">
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] px-2 py-1 rounded-md text-cyan-400 font-bold whitespace-nowrap z-10 pointer-events-none">
                        {count} {count === 1 ? 'tarea' : 'tareas'}
                      </div>
                      <div 
                        className="w-full bg-gradient-to-t from-cyan-500/10 to-cyan-500 rounded-lg transition-all duration-700 group-hover:from-purple-500/20 group-hover:to-purple-500 shadow-[0_0_15px_rgba(6,182,212,0.1)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] relative"
                        style={{ height: `${Math.max((count / maxCategoryTasks) * 100, 6)}%` }}
                      >
                        {/* Visual marker inside bar to show activity */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white/40 rounded-full"></div>
                      </div>
                    </div>
                    {/* Label */}
                    <span className="text-[10px] text-slate-500 font-black truncate w-full text-center group-hover:text-white transition-colors" title={category}>
                      {category}
                    </span>
                  </div>
                )) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 italic text-sm">Sin datos</div>
                )}
              </div>
            </div>

            {/* Member Chart */}
            <div className="bg-slate-900/60 md:glass rounded-3xl p-6 md:p-8 border border-white/5 flex flex-col h-full">
              <h4 className="text-md font-bold mb-8 flex items-center gap-2 text-white/80">
                <Users size={18} className="text-purple-400" />
                Carga por Miembro
              </h4>
              <div className="flex-1 min-h-[180px] flex flex-col gap-4">
                {chartMembers.length > 0 ? chartMembers.map((member) => (
                  <div key={member.name} className="space-y-1.5 group">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-400 group-hover:text-white transition-colors uppercase tracking-wider">{member.name}</span>
                      <span className="text-slate-500">{member.count}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-500/40 to-purple-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(168,85,247,0.1)] group-hover:to-cyan-500"
                        style={{ width: `${(member.count / maxMemberTasks) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 italic text-sm">Sin asignaciones</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Widget Column */}
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white/90">
              <Clock size={20} className="text-cyan-500" />
              Próximas Entregas
            </h3>
            <Link href="/calendar" className="text-xs font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-widest text-glow">Ver Todo</Link>
          </div>
          
          <div className="bg-slate-900/60 md:glass rounded-3xl p-5 md:p-6 space-y-2 relative overflow-hidden border border-white/5 max-h-[600px] overflow-y-auto scrollbar-subtle custom-calendar-scroll">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] rounded-full"></div>
            {sortedDateKeys.length > 0 ? (
              sortedDateKeys.map((dateKey) => (
                <div key={dateKey}>
                  <AgendaDayHeader 
                    date={getRelativeDateLabel(dateKey)} 
                    isToday={isToday(parseISO(dateKey))}
                  />
                  <div className="space-y-1">
                    {groupedDeadlines[dateKey].map((task) => {
                      const project = stats?.activeProjects.find(p => p.id === task.projectId);
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
              <div className="py-8 text-center text-slate-500 italic text-sm">No hay entregas pendientes</div>
            )}
          </div>


          {/* Quick Info Box */}
          <div className="premium-gradient p-0.5 rounded-3xl group cursor-pointer shadow-xl shadow-purple-500/5">
            <div className="bg-slate-900 rounded-[22px] p-6 group-hover:bg-slate-900/40 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <AlertCircle size={20} className="text-purple-400" />
                </div>
                <h4 className="font-bold text-white">Centro de Comando</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Métricas calculadas en tiempo real incluyendo tareas independientes y proyectos activos.
              </p>
              <button className="text-xs font-bold text-cyan-400 underline decoration-cyan-400/30 underline-offset-4 hover:decoration-cyan-400 transition-all">Soporte técnico</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, subValue, color, bgColor }: { icon: any, label: string, value: string, subValue: string, color: string, bgColor: string }) {
  return (
    <div className="bg-slate-900/40 md:glass px-4 md:px-6 py-4 rounded-2xl flex items-center gap-3 md:gap-4 border border-white/5 hover:border-white/10 transition-all group overflow-hidden">
      <div className={`w-9 h-9 md:w-10 md:h-10 shrink-0 rounded-xl ${bgColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] md:text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] mb-0.5 truncate">{label}</p>
        <div className="flex items-baseline gap-1.5 md:gap-2">
          <span className="text-lg md:text-xl font-black text-white">{value}</span>
          <span className="text-[9px] md:text-[10px] text-slate-500 font-medium whitespace-nowrap truncate">{subValue}</span>
        </div>
      </div>
    </div>
  );
}

function QuickActionLink({ href, icon: Icon, label, description, color, iconColor }: { href: string, icon: any, label: string, description: string, color: string, iconColor: string }) {
  return (
    <Link href={href} className={`flex items-center justify-center sm:justify-start gap-3 md:gap-4 p-3 sm:p-5 bg-slate-900/40 border ${color} rounded-2xl hover:bg-slate-900/60 transition-all group overflow-hidden`}>
      <div className={`w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-xl bg-slate-950 flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform shadow-lg shadow-black/20`}>
        <Icon size={20} className="md:w-6 md:h-6" />
      </div>
      <div className="min-w-0 hidden sm:block">
        <p className="text-sm md:text-base font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{label}</p>
        <p className="text-[10px] md:text-xs text-slate-500 truncate">{description}</p>
      </div>
    </Link>
  );
}

function PlusIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
