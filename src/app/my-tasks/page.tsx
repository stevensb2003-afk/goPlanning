"use client";
import Badge from '@/components/Badge';
import TaskDetailDrawer from '@/components/TaskDetailDrawer';
import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Search, 
  Filter, 
  Layers, 
  Layout, 
  Flag, 
  X 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { projectService, Task, Project } from '@/lib/services/projectService';
import { userService, UserProfile } from '@/lib/services/userService';
import { configService } from '@/lib/services/configService';
import InlineDropdown from '@/components/InlineDropdown';

export default function MyTasksPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('active'); // active, history, all
  const [filterTaskStatus, setFilterTaskStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterProject, setFilterProject] = useState('all');

  const fetchData = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const [fetchedTasks, fetchedProjects, fetchedTeam, config] = await Promise.all([
        projectService.getUserTasks(profile.uid),
        projectService.getProjects(false),
        userService.getAllUsers(),
        configService.getConfig()
      ]);
      
      setTasks(fetchedTasks);
      setProjects(fetchedProjects);
      setTeam(fetchedTeam);
      setTaskTypes(config.taskTypes);
    } catch (error) {
      console.error("Error fetching my tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile) fetchData();
  }, [profile]);

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks]);

  if (loading) return null;

  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    // Status filter (logic matches tasks/page.tsx)
    if (filterStatus === 'active') {
      if (task.status === 'done' || task.status === 'canceled') return false;
    } else if (filterStatus === 'history') {
      if (task.status !== 'done' && task.status !== 'canceled') return false;
    }

    // Task Status filter (granular)
    if (filterTaskStatus !== 'all' && task.status !== filterTaskStatus) return false;

    // Priority filter
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

    // Type filter
    if (filterType !== 'all' && task.type !== filterType) return false;

    // Project filter
    if (filterProject !== 'all' && task.projectId !== filterProject) return false;

    return true;
  });

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const canceledCount = tasks.filter(t => t.status === 'canceled').length;
  const pendingCount = tasks.filter(t => t.status !== 'done' && t.status !== 'canceled').length;

  return (
    <>
      <main className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-subtle">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Mis Tareas</h1>
              <p className="text-slate-400 text-sm">Gestiona tus responsabilidades personales.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 shadow-xl">
                <button 
                  onClick={() => setFilterStatus('active')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'active' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Activas
                </button>
                <button 
                  onClick={() => setFilterStatus('history')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === 'history' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Historial
                </button>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white/[0.02] p-2 rounded-2xl border border-white/5">
            <div className="relative group min-w-[240px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
              <input 
                type="text"
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/30 transition-all shadow-inner"
              />
            </div>

            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

            <InlineDropdown
              value={filterTaskStatus}
              onChange={setFilterTaskStatus}
              trigger={
                <div className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-inner ${filterTaskStatus !== 'all' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'}`}>
                  <CheckCircle2 size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Estado</span>
                </div>
              }
              options={[
                { value: 'all', label: 'Todos los Estados', icon: <CheckCircle2 size={14} /> },
                { value: 'todo', label: 'Pendiente', icon: <div className="w-2 h-2 rounded-full bg-slate-500" /> },
                { value: 'in-progress', label: 'En Progreso', icon: <div className="w-2 h-2 rounded-full bg-cyan-500" /> },
                { value: 'pending-approval', label: 'Por Aprobar', icon: <div className="w-2 h-2 rounded-full bg-pink-500" /> },
                { value: 'published', label: 'Publicar / Compartir', icon: <div className="w-2 h-2 rounded-full bg-indigo-500" /> },
                { value: 'frozen', label: 'Congelado', icon: <div className="w-2 h-2 rounded-full bg-amber-500" /> },
                { value: 'done', label: 'Completado', icon: <div className="w-2 h-2 rounded-full bg-emerald-500" /> },
                { value: 'canceled', label: 'Cancelado', icon: <div className="w-2 h-2 rounded-full bg-rose-500" /> },
              ]}
            />

            <InlineDropdown
              value={filterPriority}
              onChange={setFilterPriority}
              trigger={
                <div className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-inner ${filterPriority !== 'all' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'}`}>
                  <Flag size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{filterPriority === 'all' ? 'Prioridad' : filterPriority}</span>
                </div>
              }
              options={[
                { value: 'all', label: 'Todas las Prioridades', icon: <Filter size={14} /> },
                { value: 'Alta', label: 'Alta', icon: <div className="w-2 h-2 rounded-full bg-rose-500" /> },
                { value: 'Media', label: 'Media', icon: <div className="w-2 h-2 rounded-full bg-amber-500" /> },
                { value: 'Baja', label: 'Baja', icon: <div className="w-2 h-2 rounded-full bg-emerald-500" /> },
              ]}
            />

            <InlineDropdown
              value={filterType}
              onChange={setFilterType}
              trigger={
                <div className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-inner ${filterType !== 'all' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'}`}>
                  <Layers size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{filterType === 'all' ? 'Tipo' : filterType}</span>
                </div>
              }
              options={[
                { value: 'all', label: 'Todos los Tipos', icon: <Filter size={14} /> },
                ...taskTypes.map(t => ({ value: t, label: t }))
              ]}
            />

            <InlineDropdown
              value={filterProject}
              onChange={setFilterProject}
              withSearch={true}
              trigger={
                <div className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-inner ${filterProject !== 'all' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'}`}>
                  <Layout size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {filterProject === 'all' ? 'Proyecto' : projects.find(p => p.id === filterProject)?.title || 'Proyecto'}
                  </span>
                </div>
              }
              options={[
                { value: 'all', label: 'Todos los Proyectos', icon: <Filter size={14} /> },
                ...projects.map(p => ({ value: p.id || '', label: p.title }))
              ]}
            />

            {(searchQuery || filterPriority !== 'all' || filterType !== 'all' || filterProject !== 'all') && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setFilterTaskStatus('all');
                  setFilterPriority('all');
                  setFilterType('all');
                  setFilterProject('all');
                }}
                className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ml-auto"
              >
                <X size={14} />
                Limpiar
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <div 
                    key={task.id} 
                    onClick={() => setSelectedTask(task)}
                    className="glass p-5 rounded-2xl flex items-center justify-between border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.03] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${task.status === 'done' ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`}>
                        {task.status === 'done' ? <CheckCircle2 className="text-emerald-400" size={20} /> : <AlertCircle className="text-purple-400" size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{task.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                          {projects.find(p => p.id === task.projectId)?.title || 'Proyecto'} • 
                          <span className="text-slate-600 ml-1">{task.type || 'Tarea'}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge variant={task.status === 'done' ? 'emerald' : 'purple'} className="text-[10px]">
                        {task.status || 'Pendiente'}
                      </Badge>
                      <ChevronRight size={16} className="text-slate-600" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white/[0.01] border border-dashed border-white/10 rounded-3xl p-12 text-center space-y-3">
                  <CheckCircle2 className="mx-auto text-slate-800" size={40} />
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                    {searchQuery || filterPriority !== 'all' || filterType !== 'all' || filterProject !== 'all' 
                      ? 'No hay tareas con estos filtros' 
                      : 'No tienes tareas pendientes'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="glass p-6 rounded-3xl space-y-6">
                <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar size={14} className="text-cyan-400" />
                  Resumen Semanal
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completadas</span>
                    <span className="text-emerald-400 text-lg font-black">{completedCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Canceladas</span>
                    <span className="text-rose-400 text-lg font-black">{canceledCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendientes</span>
                    <span className="text-purple-400 text-lg font-black">{pendingCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </main>

      <TaskDetailDrawer 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        task={selectedTask ? {
          ...selectedTask,
          name: selectedTask.title,
          project: projects.find(p => p.id === selectedTask.projectId)?.title || 'Proyecto Desconocido',
          ownerData: team.find(u => u.uid === selectedTask.assignedTo?.[0])
        } : null}
        team={team}
        taskTypes={taskTypes}
        onUpdate={fetchData}
      />
    </>
  );
}
