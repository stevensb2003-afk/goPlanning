"use client";
import { useState } from 'react';
import CalendarGrid from '@/components/CalendarGrid';
import { Layers, Calendar as CalendarIcon, Filter, ClipboardList, Menu as MenuIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { useData } from '@/context/DataContext';
import InlineDropdown from '@/components/InlineDropdown';
import TaskListSidePanel from '../../components/TaskListSidePanel';

export default function CalendarPage() {
  const { profile, isAdmin } = useAuth();
  const { toggleSidebar } = useUI();
  const { tasks, projects, team, isLoading } = useData();
  
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);

  // Filters
  const [calendarMode, setCalendarMode] = useState<'team' | 'personal'>('team');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  
  // View mode
  const [viewType, setViewType] = useState<'month' | '2weeks' | '1week'>('1week');

  if (isLoading && tasks.length === 0) return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
  );

  // Apply filters
  let filteredTasks = tasks.map(t => ({
    ...t,
  })).filter(t => t.dueDate && t.status !== 'canceled');

  if (calendarMode === 'personal') {
    filteredTasks = filteredTasks.filter(t => t.assignedTo?.includes(profile?.uid || ""));
  }

  if (selectedProjectId !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.projectId === selectedProjectId);
  }

  const pendingCount = filteredTasks.filter(t => t.status !== 'done').length;

  return (
    <main className="flex-1 h-full flex flex-col overflow-hidden bg-slate-950">
      {/* STICKY HEADER SECTION */}
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 pt-8 pb-4 px-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden shadow-lg active:scale-95 transition-all"
            >
              <MenuIcon size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Calendario Editorial</h1>
              <p className="text-slate-500 text-[10px] md:text-xs font-medium uppercase tracking-[0.2em] mt-1">Gestión de entregas y lanzamientos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex flex-row items-center gap-2 bg-slate-900/50 border border-white/5 p-1 rounded-xl w-full md:w-auto">
              <button 
                onClick={() => setCalendarMode('team')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  calendarMode === 'team' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                <Layers size={14} className={calendarMode === 'team' ? "text-cyan-400" : ""} />
                Equipo
              </button>
              <button 
                onClick={() => setCalendarMode('personal')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  calendarMode === 'personal' ? 'bg-white/10 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
              >
                <CalendarIcon size={14} className={calendarMode === 'personal' ? "text-purple-400" : ""} />
                Personal
              </button>
            </div>
          </div>
        </div>

        {/* Filters & Navigation Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            <InlineDropdown
              value={selectedProjectId}
              onChange={setSelectedProjectId}
              options={[
                { value: 'all', label: 'Todos los Proyectos', icon: <Filter size={14} /> },
                ...projects.map(p => ({
                  value: p.id!,
                  label: p.title,
                  icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || '#A855F7' }} />
                }))
              ]}
              trigger={
                <div className="flex items-center gap-2 bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 hover:bg-white/5 transition-all cursor-pointer shadow-inner shrink-0">
                  <Filter size={14} className="text-slate-500" />
                  <span className="text-xs text-white font-bold tracking-tight whitespace-nowrap">
                    {selectedProjectId === 'all' ? 'Todos los Proyectos' : projects.find(p => p.id === selectedProjectId)?.title}
                  </span>
                </div>
              }
            />

            <div className="flex items-center gap-1 bg-slate-950/50 rounded-xl p-1 border border-white/5 shrink-0">
              <button onClick={() => setViewType('1week')} className={`px-3 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${viewType === '1week' ? 'bg-white/10 text-cyan-400 shadow-inner' : 'text-slate-500 hover:text-white'}`}>1 Sem</button>
              <button onClick={() => setViewType('2weeks')} className={`px-3 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${viewType === '2weeks' ? 'bg-white/10 text-cyan-400 shadow-inner' : 'text-slate-500 hover:text-white'}`}>2 Sem</button>
              <button onClick={() => setViewType('month')} className={`px-3 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${viewType === 'month' ? 'bg-white/10 text-cyan-400 shadow-inner' : 'text-slate-500 hover:text-white'}`}>Mes</button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsTaskListOpen(!isTaskListOpen)}
              className={`group flex items-center gap-3 border p-2 px-5 rounded-2xl transition-all duration-300 w-full sm:w-auto justify-center ${
                isTaskListOpen 
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-purple-500/30 hover:text-purple-400'
              }`}
            >
              <ClipboardList size={18} className={`${isTaskListOpen ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-widest">Lista de Tareas</span>
                <span className={`text-[8px] font-bold mt-0.5 ${isTaskListOpen ? 'text-purple-300/60' : 'text-slate-500'}`}>
                  {pendingCount} pendientes
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* DYNAMIC CONTENT AREA (GRID + SIDE PANEL) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* SCROLLABLE GRID container */}
        <div className={`flex-1 min-w-0 overflow-y-auto p-4 md:p-8 scrollbar-subtle custom-calendar-scroll transition-all duration-500 ease-in-out`}>
          <div className="max-w-[1700px] mx-auto pb-12">
            <CalendarGrid 
              tasks={filteredTasks} 
              projects={projects}
              team={team}
              viewType={viewType}
            />
          </div>
        </div>

        {/* SIDE PANEL (NON-FIXED) */}
        <TaskListSidePanel 
          isOpen={isTaskListOpen}
          onClose={() => setIsTaskListOpen(false)}
          tasks={filteredTasks}
          projects={projects}
        />
      </div>
    </main>
  );
}
