"use client";
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import ProjectCard from '@/components/ProjectCard';
import { Filter, Search, Plus, LayoutGrid, List as ListIcon, Archive, FolderArchive, ChevronDown, Calendar } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { projectService, Project } from '@/lib/services/projectService';
import { db } from '@/lib/firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import CreateProjectModal from '@/components/CreateProjectModal';
import ProjectDetailModal from '@/components/ProjectDetailModal';
import { useUI } from '@/context/UIContext';
import { Menu as MenuIcon } from 'lucide-react';

export default function ProjectsPage() {
  const { profile } = useAuth();
  const { toggleSidebar } = useUI();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  const [showArchived, setShowArchived] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      const data = await projectService.getProjects(true); // fetch all including archived
      setProjects(data);
      
      // Update selected project to reflect changes
      setSelectedProject(prev => {
        if (!prev?.id) return prev;
        const updated = data.find(p => p.id === prev.id);
        return updated || prev;
      });
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(projects.map(p => p.category))).filter(Boolean);
  }, [projects]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-950">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    </div>
  );

  const filteredProjects = projects.filter(p => {
    const isArchived = p.status === 'canceled';
    if (showArchived && !isArchived) return false;
    if (!showArchived && isArchived) return false;

    if (filterCategory && p.category !== filterCategory) return false;

    const title = p.title?.toLowerCase() || "";
    const category = p.category?.toLowerCase() || "";
    const search = searchQuery.toLowerCase();
    
    return title.includes(search) || category.includes(search);
  });

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-slate-950">
      {/* STICKY HEADER SECTION */}
      <div className="z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 pt-8 pb-4 px-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden shadow-lg active:scale-95 transition-all"
            >
              <MenuIcon size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Proyectos</h1>
              <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em] mt-1">
                Gestiona y supervisa todos los proyectos creativos en curso.
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-2 group ${showArchived ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800 shadow-inner'}`}
              title={showArchived ? "Ver proyectos activos" : "Ver proyectos archivados"}
            >
              {showArchived ? <Archive size={18} /> : <FolderArchive size={18} />}
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline ml-1">
                {showArchived ? "Activos" : "Archivados"}
              </span>
            </button>
            
            <button 
              onClick={() => setIsModalOpen(true)}
              className="premium-gradient p-3 sm:px-6 sm:py-3 rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
            >
              <Plus size={20} className="text-white" />
              <span className="text-xs font-black text-white uppercase tracking-widest hidden sm:inline">Nuevo Proyecto</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar proyectos..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all text-white shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-950/50 p-1.5 rounded-2xl border border-white/5 shrink-0 relative">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white/10 text-cyan-400 shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white/10 text-cyan-400 shadow-lg' : 'text-slate-500 hover:text-white'}`}
            >
              <ListIcon size={18} />
            </button>
            
            <div className="w-[1px] h-6 bg-white/10 mx-1"></div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 transition-colors text-[10px] font-black uppercase tracking-widest rounded-xl ${filterCategory ? 'text-cyan-400 bg-white/5' : 'text-slate-500 hover:text-white'}`}
            >
              <Filter size={14} />
              Filtros
              {(showFilters || filterCategory) && <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />}
            </button>

            {showFilters && (
              <div className="absolute top-full right-0 mt-3 w-48 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-3 mt-1">Categoría</div>
                <button
                  onClick={() => { setFilterCategory(null); setShowFilters(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${!filterCategory ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-white/5'}`}
                >
                  Todas
                </button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setFilterCategory(cat); setShowFilters(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${filterCategory === cat ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-400 hover:bg-white/5'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SCROLLABLE GRID/LIST AREA */}
      <div className="flex-1 overflow-y-auto p-8 pt-6 scrollbar-subtle max-w-[1700px] mx-auto w-full">
        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12" : "bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden mb-12"}>
          {viewMode === 'grid' ? (
            filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                id={project.id!}
                title={project.title}
                category={project.category}
                progress={project.progress}
                members={project.members?.length || 0}
                status={project.status || 'active'}
                color={project.color}
                startDate={project.startDate}
                endDate={project.endDate}
                isDateRange={project.isDateRange}
                onClick={() => setSelectedProject(project)}
              />
            ))
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-950/40">
                  <th className="p-5 pl-8">Proyecto</th>
                  <th className="p-5 hidden md:table-cell">Fecha</th>
                  <th className="p-5 hidden md:table-cell">Categoría</th>
                  <th className="p-5">Progreso</th>
                  <th className="p-5 hidden sm:table-cell pr-8">Miembros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProjects.map((project) => (
                  <tr 
                    key={project.id} 
                    onClick={() => setSelectedProject(project)}
                    className="hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: project.color }}></div>
                        <span className="font-bold text-white group-hover:text-cyan-400 transition-colors tracking-tight">{project.title}</span>
                      </div>
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      {project.startDate ? (
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Calendar size={12} className="text-cyan-500/50" />
                          <span>
                            {project.isDateRange ? `${project.startDate} - ${project.endDate}` : project.startDate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic opacity-50">Sin fecha</span>
                      )}
                    </td>
                    <td className="p-5 hidden md:table-cell">
                      <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-slate-800 text-slate-400 border border-white/5 shadow-inner">
                        {project.category}
                      </span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-32 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <div 
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ 
                              width: `${project.progress}%`,
                              backgroundColor: project.color,
                              boxShadow: `0 0 10px ${project.color}40`
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-black tracking-widest">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="p-5 hidden sm:table-cell pr-8">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(project.members?.length || 0, 3))].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-white shadow-xl"
                          >
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                        {(project.members?.length || 0) > 3 && (
                          <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-xl">
                            +{(project.members?.length || 0) - 3}
                          </div>
                        )}
                        {(project.members?.length || 0) === 0 && (
                          <span className="text-slate-600 text-[10px] font-black uppercase tracking-widest italic opacity-50">Sin miembros</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {filteredProjects.length === 0 && (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-slate-600 space-y-6">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center shadow-inner">
                <Search size={40} className="text-slate-700" />
              </div>
              <div className="text-center">
                <p className="font-black text-xl mb-1 uppercase tracking-[0.2em]">Cero Coincidencias</p>
                <p className="text-sm font-medium opacity-50 uppercase tracking-widest">
                  {searchQuery ? `No encontramos proyectos con "${searchQuery}"` : (showArchived ? "No hay proyectos archivados aún." : "No hay proyectos creados todavía.")}
                </p>
              </div>
              {!searchQuery && !showArchived && (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-cyan-400 font-black uppercase tracking-widest hover:bg-white/10 transition-all text-xs"
                >
                  Crea el primero ahora
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onProjectCreated={fetchProjects}
      />

      {selectedProject && (
        <ProjectDetailModal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          project={selectedProject}
          onUpdate={fetchProjects}
        />
      )}
    </div>
  );
}
