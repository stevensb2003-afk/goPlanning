"use client";
import UserCard from '@/components/UserCard';
import { UserPlus, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { userService, UserProfile } from '@/lib/services/userService';
import { projectService } from '@/lib/services/projectService';
import { configService, AppConfig } from '@/lib/services/configService';
import InviteModal from '@/components/InviteModal';
import MemberDetailModal from '@/components/MemberDetailModal';
import { parseLocalDate } from '@/lib/dateUtils';
import InlineDropdown from '@/components/InlineDropdown';
import { Shield, Camera, Video, PenTool, Edit3, Share2, Volume2, Sun, HelpCircle, Filter, Menu as MenuIcon } from 'lucide-react';
import { useUI } from '@/context/UIContext';

interface MemberProductivity {
  userId: string;
  total: number;
  completed: number;
  score: number;
}

export default function TeamPage() {
  const { profile, isAdmin } = useAuth();
  const { toggleSidebar } = useUI();
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [memberProductivity, setMemberProductivity] = useState<Record<string, MemberProductivity>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, allTasks, appConfig] = await Promise.all([
          userService.getAllUsers(),
          projectService.getAllTasks(),
          configService.getConfig()
        ]);
        
        setTeam(users || []);
        setConfig(appConfig);
        
        // Calculate metrics per user
        const prodData: Record<string, MemberProductivity> = {};
        const now = new Date();
        
        if (users) {
          users.forEach(user => {
            const userTasks = allTasks ? allTasks.filter(t => t.assignedTo?.includes(user.uid)) : [];
            let totalScore = 0;
            let completed = 0;
            
            userTasks.forEach(task => {
              if (task.status === 'done') completed++;
              
              const dueDate = task.dueDate ? parseLocalDate(task.dueDate) : null;
              const completedAt = task.completedAt?.toDate?.() || 
                                  (task.status === 'done' ? (task.updatedAt?.toDate?.() || now) : null);
              
              if (task.status === 'done') {
                if (!dueDate || completedAt <= dueDate) {
                  totalScore += 100;
                } else {
                  totalScore += 70;
                }
              } else {
                if (dueDate && now > dueDate) {
                  totalScore += 0;
                } else {
                  totalScore += 50;
                }
              }
            });
            
            prodData[user.uid] = {
              userId: user.uid,
              total: userTasks.length,
              completed,
              score: userTasks.length > 0 ? Math.round(totalScore / userTasks.length) : 100
            };
          });
          
          setMemberProductivity(prodData);
        }

      } catch (error) {
        console.error("Error fetching team data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return null;

  const tabs = ['Todos', ...(config?.collaboratorSpecialties || []), 'Admin'];

  const filteredTeam = team.filter(user => {
    // Search filter
    const searchMatch = !searchQuery || 
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!searchMatch) return false;

    if (activeTab === 'Todos') return true;
    if (activeTab === 'Admin') return user.baseRole === 'admin';
    return user.specialty === activeTab;
  });

  const filterOptions = [
    { value: 'Todos', label: 'Todos los Miembros', icon: <Filter size={14} /> },
    ...(isAdmin ? [{ value: 'Admin', label: 'Administradores', icon: <Shield size={14} className="text-purple-400" /> }] : []),
    ...(config?.collaboratorSpecialties || []).map(s => ({
        value: s,
        label: s,
        icon: s.includes('Foto') ? <Camera size={14} className="text-cyan-400" /> : 
              s.includes('Video') || s.includes('Editor') ? <Video size={14} className="text-emerald-400" /> :
              s.includes('Dise') ? <Edit3 size={14} className="text-rose-400" /> :
              s.includes('Redact') || s.includes('Escrit') ? <PenTool size={14} className="text-amber-400" /> :
              s.includes('Social') ? <Share2 size={14} className="text-pink-400" /> :
              s.includes('Sonido') ? <Volume2 size={14} className="text-indigo-400" /> :
              s.includes('Ilumin') ? <Sun size={14} className="text-yellow-400" /> :
              <HelpCircle size={14} className="text-slate-400" />
    }))
  ];

  return (
    <>
      <main className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-950/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleSidebar}
                className="p-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden shadow-lg active:scale-95 transition-all"
              >
                <MenuIcon size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Equipo Creativo</h1>
                <p className="text-slate-400 text-sm mt-1">Gestiona roles, permisos y asignaciones del grupo.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Buscar miembro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white text-sm focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
                />
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setIsInviteModalOpen(true)}
                  className="premium-gradient px-6 py-3 rounded-2xl shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group whitespace-nowrap"
                >
                  <UserPlus size={20} className="text-white" />
                  <span className="text-sm font-bold text-white">Añadir Miembro</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
              <InlineDropdown 
                  value={activeTab}
                  options={filterOptions}
                  onChange={setActiveTab}
                  trigger={
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer group/filter">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover/filter:text-slate-400 transition-colors">Filtrar por:</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-wider">
                            {filterOptions.find(o => o.value === activeTab)?.label || activeTab}
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
                        </div>
                    </div>
                  }
              />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTeam.map((user) => (
              <UserCard 
                key={user.uid}
                uid={user.uid}
                name={user.fullName || user.displayName || 'Usuario'} 
                email={user.email}
                role={user.specialty || (user.baseRole === 'admin' ? 'Administrador' : 'Miembro')}
                baseRole={user.baseRole}
                specialty={user.specialty || undefined}
                avatar={user.photoURL || undefined}
                tasks={memberProductivity[user.uid]?.total || 0} 
                productivity={memberProductivity[user.uid]?.score || 100}
                status="online"
                canEditRole={isAdmin && user.uid !== profile?.uid}
                onRoleUpdate={() => {
                   userService.getAllUsers().then(setTeam);
                }}
                onClick={() => {
                    setSelectedUser(user);
                    setIsDetailModalOpen(true);
                }}
                specialtyOptions={config?.collaboratorSpecialties || []}
              />
            ))}
            
            {/* Invite placeholder */}
            {isAdmin && (
              <div 
                onClick={() => setIsInviteModalOpen(true)}
                className="border-2 border-dashed border-white/5 rounded-[2.5rem] p-6 flex flex-col items-center justify-center text-slate-500 hover:border-purple-500/30 hover:bg-purple-500/5 hover:text-slate-400 transition-all cursor-pointer group min-h-[300px]"
              >
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-all duration-300 shadow-lg">
                  <UserPlus size={24} />
                </div>
                <p className="text-sm font-bold tracking-tight">Enviar Invitación</p>
                <p className="text-[10px] mt-2 text-slate-600 uppercase tracking-widest font-medium">Por correo o enlace directo</p>
              </div>
            )}
          </div>
      </main>

      <InviteModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        specialties={config?.collaboratorSpecialties || []}
      />

      <MemberDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        user={selectedUser}
        tasks={selectedUser ? (memberProductivity[selectedUser.uid]?.total || 0) : 0}
        productivity={selectedUser ? (memberProductivity[selectedUser.uid]?.score || 0) : 0}
      />
    </>
  );
}

