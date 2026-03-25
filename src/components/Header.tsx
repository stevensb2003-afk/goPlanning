"use client";
import { Search, Bell, Plus, Briefcase, CheckSquare, Loader2, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { projectService, Project, Task } from '@/lib/services/projectService';
import { getStatusConfig } from '@/lib/constants';
import NotificationBell from './NotificationBell';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredResults, setFilteredResults] = useState<{ projects: Project[], tasks: Task[] }>({ projects: [], tasks: [] });
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch all projects and tasks for searching
  useEffect(() => {
    const fetchSearchData = async () => {
      setLoading(true);
      try {
        const [allProjects, allTasks] = await Promise.all([
          projectService.getProjects(),
          projectService.getAllTasks()
        ]);
        setProjects(allProjects);
        setTasks(allTasks);
      } catch (error) {
        console.error("Error fetching search data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchData();
  }, []);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update results as user types
  useEffect(() => {
    if (query.trim().length < 2) {
      setFilteredResults({ projects: [], tasks: [] });
      setIsOpen(false);
      return;
    }

    const searchTerm = query.toLowerCase();
    const matchedProjects = projects.filter(p => 
      p.title.toLowerCase().includes(searchTerm) || 
      (p.description && p.description.toLowerCase().includes(searchTerm))
    ).slice(0, 5);

    const matchedTasks = tasks.filter(t => 
      t.status !== 'canceled' && (
      t.title.toLowerCase().includes(searchTerm) || 
      (t.description && t.description.toLowerCase().includes(searchTerm))
      )
    ).slice(0, 5);

    setFilteredResults({ projects: matchedProjects, tasks: matchedTasks });
    setIsOpen(matchedProjects.length > 0 || matchedTasks.length > 0);
  }, [query, projects, tasks]);



  return (
    <header className="h-20 border-b border-white/10 flex items-center justify-between gap-4 px-4 sm:px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar proyectos, tareas..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
          />
          
          {loading && query.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="animate-spin text-cyan-500" size={16} />
            </div>
          )}

          {query.length > 0 && !loading && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          )}

          {/* Results Dropdown */}
          {isOpen && (
            <div 
              className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <style jsx>{`
                @keyframes fadeInSlide {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .animate-in {
                  animation: fadeInSlide 0.2s ease-out forwards;
                }
              `}</style>
              
              {filteredResults.projects.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Proyectos</p>
                  {filteredResults.projects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => {
                        router.push(`/projects?id=${project.id}`);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-3 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                        <Briefcase size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{project.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{project.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {filteredResults.tasks.length > 0 && (
                <div>
                  <p className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tareas</p>
                  {filteredResults.tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => {
                        router.push(`/tasks?taskId=${task.id}`);
                        setIsOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/5 flex items-center gap-3 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                        <CheckSquare size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{task.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Estado:</span>
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5">
                            <span style={{ color: getStatusConfig(task.status).color }}>
                              {getStatusConfig(task.status).icon}
                            </span>
                            <span className="text-[9px] font-bold whitespace-nowrap" style={{ color: getStatusConfig(task.status).color }}>
                              {getStatusConfig(task.status).label.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.push('/projects')}
          className="premium-gradient p-2.5 rounded-xl shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="text-white" />
          <span className="text-sm font-semibold text-white px-1 hidden sm:inline">Nuevo Proyecto</span>
        </button>
        
        <NotificationBell />
      </div>
    </header>
  );
}
