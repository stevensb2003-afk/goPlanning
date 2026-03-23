"use client";
import TaskTable, { priorityOptions } from '@/components/TaskTable';
import TaskDetailDrawer from '@/components/TaskDetailDrawer';
import InlineDropdown from '@/components/InlineDropdown';
import { Filter, ArrowUpDown, Search, User, CheckCircle2, Layers, Users, Plus, AlertCircle, Circle, Clock, Snowflake, Layout } from 'lucide-react';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { projectService, Task, Project, TaskStatus } from '@/lib/services/projectService';
import { userService, UserProfile } from '@/lib/services/userService';
import { configService } from '@/lib/services/configService';
import NewTaskModal from '@/components/NewTaskModal';
import { useUI } from '@/context/UIContext';
import { useData } from '@/context/DataContext';
import { Menu as MenuIcon } from 'lucide-react';

function TasksContent() {
  const { profile, isAdmin } = useAuth();
  const { tasks, projects, team, taskTypes, isLoading: initiallyLoading, refreshData } = useData();
  const { toggleSidebar } = useUI();
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get('taskId');
  const taskIdParamOld = searchParams.get('id'); // Support for old notifications
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Advanced Filters
  const [viewMode, setViewMode] = useState<'mine' | 'all' | 'pending'>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [taskView, setTaskView] = useState<'active' | 'completed'>('active');
  const [filterProject, setFilterProject] = useState<string>('all');

  const handleLocalUpdate = (taskId: string, updates: Partial<Task>) => {
    // Note: Local UI update is less critical now with onSnapshot, 
    // but still provides immediate feedback.
    // In a full refactor, we might want to move handleLocalUpdate to context
    // but for now it works here as a placeholder.
  };

  useEffect(() => {
    if (profile && !isAdmin && viewMode === 'all') {
      setViewMode('mine');
    }
  }, [profile, isAdmin]);

  useEffect(() => {
    const handleDeepLink = async () => {
      const effectTaskId = taskIdParam || taskIdParamOld;
      if (!effectTaskId) return;
      
      // 1. Try to find in already loaded tasks
      const taskInList = tasks.find(t => t.id === effectTaskId);
      if (taskInList) {
        setSelectedTask(taskInList);
        // Auto-switch view to 'completed' if the task is done/canceled
        if (taskInList.status === 'done' || taskInList.status === 'canceled') {
          setTaskView('completed');
        } else {
          setTaskView('active');
        }
        return;
      }

      // 2. If not found and finished initial loading, try to fetch individually
      if (!initiallyLoading) {
        try {
          const fetchedTask = await projectService.getTaskById(effectTaskId);
          if (fetchedTask) {
            setSelectedTask(fetchedTask);
            if (fetchedTask.status === 'done' || fetchedTask.status === 'canceled') {
              setTaskView('completed');
            } else {
              setTaskView('active');
            }
          }
        } catch (error) {
          console.error("Error fetching deep-linked task:", error);
        }
      }
    };

    handleDeepLink();
  }, [taskIdParam, tasks, initiallyLoading]);

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find(t => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks]);

  if (initiallyLoading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
  );

  const filteredTasks = tasks.filter(task => {
    const search = searchQuery.toLowerCase();
    const titleMatch = task.title?.toLowerCase().includes(search) || false;
    const assigneeMatch = task.assignedTo?.some(uid => {
      const u = team.find(ut => ut.uid === uid);
      return u?.fullName?.toLowerCase().includes(search);
    }) || false;
    
    if (search && !titleMatch && !assigneeMatch) return false;

    if (taskView === 'active') {
      if (task.status === 'done' || task.status === 'canceled') return false;
    } else {
      if (task.status !== 'done' && task.status !== 'canceled') return false;
    }

    if (viewMode === 'mine' && profile) {
      if (!task.assignedTo?.includes(profile.uid)) return false;
    }

    if (viewMode === 'pending') {
      if (task.status !== 'pending-approval') return false;
    }

    if (filterUser !== 'all') {
      if (!task.assignedTo?.includes(filterUser)) return false;
    }

    if (filterStatus !== 'all') {
      if (task.status !== filterStatus) return false;
    }

    if (filterType !== 'all') {
      if (task.type !== filterType) return false;
    }

    if (filterPriority !== 'all') {
      if (task.priority !== filterPriority) return false;
    }

    if (filterProject !== 'all') {
      if (task.projectId !== filterProject) return false;
    }

    // Filter tasks from archived projects (if task is tied to a project)
    const activeProjectIds = new Set(projects.map(p => p.id));
    if (task.projectId && !activeProjectIds.has(task.projectId)) return false;

    return true;
  });

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-slate-950">
      {/* STICKY HEADER SECTION */}
      <div className="z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 pt-8 pb-4 px-8 space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden shadow-lg active:scale-95 transition-all"
            >
              <MenuIcon size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Gestión de Tareas</h1>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em] mt-1">
                {isAdmin 
                  ? "Organiza y rastrea todas las tareas del equipo." 
                  : "Organiza y rastrea tus tareas asignadas."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto">
            {/* MAIN VIEW TOGGLE */}
            <div className="flex bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 shadow-xl">
              <button 
                onClick={() => setTaskView('active')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${taskView === 'active' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Activas
                <div className={`w-1.5 h-1.5 rounded-full ${taskView === 'active' ? 'bg-white animate-pulse' : 'bg-slate-700'}`} />
              </button>
              <button 
                onClick={() => setTaskView('completed')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${taskView === 'completed' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Historial
                <CheckCircle2 size={14} className={taskView === 'completed' ? 'text-white' : 'text-slate-700'} />
              </button>
            </div>

            {isAdmin && (
              <button 
                onClick={() => setIsNewTaskModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all text-xs font-black uppercase tracking-widest group ml-auto lg:ml-0"
              >
                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="hidden sm:inline">Nueva Tarea</span>
              </button>
            )}
          </div>
        </div>

        {(taskView === 'active' || taskView === 'completed') && (
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3 bg-white/[0.02] p-3 sm:p-2 rounded-2xl border border-white/5">
            {/* VIEW MODE TOGGLE - Row 1 on Mobile */}
            <div className="w-full sm:w-auto flex justify-center sm:justify-start">
              <div className="flex w-full sm:w-auto bg-slate-950/50 p-1 rounded-xl border border-white/5">
                <button 
                  onClick={() => setViewMode('mine')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'mine' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 hover:text-white'}`}
                >
                  Mis Tareas
                </button>
                {isAdmin && (
                  <>
                    <button
                      onClick={() => setViewMode('all')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        viewMode === 'all' 
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                          : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      Equipo
                    </button>
                    <button
                      onClick={() => setViewMode('pending')}
                      className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        viewMode === 'pending' 
                          ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20' 
                          : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      Por Aprobar
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />

            {/* FILTER ICONS - Row 2 on Mobile */}
            <div className="flex justify-between sm:justify-start items-center gap-2 sm:gap-3 w-full sm:w-auto px-1 sm:px-0">
              {/* USER FILTER */}
              {isAdmin && (
                <InlineDropdown
                  value={filterUser}
                  onChange={setFilterUser}
                  withSearch={true}
                  align="right"
                  trigger={
                    <div className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-inner ${filterUser !== 'all' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'}`}>
                      <Users size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                        {filterUser === 'all' ? 'Usuario' : team.find(u => u.uid === filterUser)?.fullName?.split(' ')[0] || 'Usuario'}
                      </span>
                    </div>
                  }
                  options={[
                    { value: 'all', label: 'Todos los Usuarios', icon: <Users size={14} /> },
                    ...team.map(u => ({
                      value: u.uid,
                      label: u.fullName || 'Usuario',
                      icon: u.photoURL ? <img src={u.photoURL} className="w-4 h-4 rounded-full object-cover shadow-sm" alt="" /> : <User size={14} />
                    }))
                  ]}
                />
              )}
              {/* STATUS FILTER */}
              <InlineDropdown
                value={filterStatus}
                onChange={setFilterStatus}
                align="right"
                trigger={
                  <div className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-inner ${filterStatus !== 'all' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'}`}>
                    <CheckCircle2 size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Estado</span>
                  </div>
                }
                options={[
                  { value: 'all', label: 'Todos los Estados', icon: <CheckCircle2 size={14} /> },
                  { value: 'todo', label: 'Pendiente', icon: <Circle size={14} /> },
                  { value: 'in-progress', label: 'En Progreso', icon: <Clock size={14} /> },
                  { value: 'pending-approval', label: 'Por Aprobar', icon: <Clock size={14} /> },
                  { value: 'published', label: 'Publicar', icon: <Clock size={14} /> },
                  { value: 'frozen', label: 'Congelado', icon: <Snowflake size={14} /> },
                  { value: 'done', label: 'Completada', icon: <CheckCircle2 size={14} /> },
                  { value: 'canceled', label: 'Cancelada', icon: <AlertCircle size={14} /> },
                ]}
              />

              {/* PRIORITY FILTER */}
              <InlineDropdown
                value={filterPriority}
                onChange={setFilterPriority}
                align="right"
                trigger={
                  <div className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-inner ${filterPriority !== 'all' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'}`}>
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Prioridad</span>
                  </div>
                }
                options={[
                  { value: 'all', label: 'Todas las Prioridades', icon: <AlertCircle size={14} /> },
                  ...priorityOptions.map(p => ({ value: p.value, label: p.label, icon: p.icon }))
                ]}
              />

              {/* TYPE FILTER */}
              <InlineDropdown
                value={filterType}
                onChange={setFilterType}
                align="right"
                trigger={
                  <div className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-inner ${filterType !== 'all' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'}`}>
                    <Layers size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Tipo</span>
                  </div>
                }
                options={[
                  { value: 'all', label: 'Todos los Tipos', icon: <Layers size={14} /> },
                  ...(taskTypes || []).map(t => ({ value: t, label: t, icon: <div className="w-1.5 h-1.5 rounded-full bg-purple-400" /> }))
                ]}
              />

              {/* PROJECT FILTER */}
              <InlineDropdown
                value={filterProject}
                onChange={setFilterProject}
                withSearch={true}
                align="right"
                trigger={
                  <div className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 cursor-pointer shadow-inner ${filterProject !== 'all' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10'}`}>
                    <Layout size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                      {filterProject === 'all' ? 'Proyecto' : projects.find(p => p.id === filterProject)?.title || 'Proyecto'}
                    </span>
                  </div>
                }
                options={[
                  { value: 'all', label: 'Todos los Proyectos', icon: <Filter size={14} /> },
                  ...projects.map(p => ({ value: p.id || '', label: p.title }))
                ]}
              />
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Filtro rápido por nombre o encargado..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all text-white shadow-inner"
          />
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8 pt-6 scrollbar-subtle max-w-[1700px] mx-auto w-full">
        <TaskTable 
          tasks={filteredTasks} 
          projects={projects} 
          team={team} 
          taskTypes={taskTypes}
          onUpdate={refreshData}
          onLocalUpdate={() => {}} // Snapshot will handle UI sync
          onTaskClick={setSelectedTask}
          isAdmin={isAdmin}
          isPendingView={viewMode === 'pending'}
          isCompletedView={taskView === 'completed'}
          currentUserProfile={profile}
        />
      </div>

      <TaskDetailDrawer 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
        task={selectedTask ? {
          ...selectedTask,
          name: selectedTask.title || '',
          project: projects.find(p => p.id === selectedTask.projectId)?.title || '(Independiente)',
          ownerData: team.find(u => u.uid === (selectedTask.assignedTo?.[0] || ''))
        } : null} 
        team={team}
        taskTypes={taskTypes}
        onUpdate={refreshData}
        onLocalUpdate={() => {}}
      />

      <NewTaskModal 
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onSuccess={refreshData}
        projects={projects}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksContent />
    </Suspense>
  );
}
