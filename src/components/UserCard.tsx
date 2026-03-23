"use client";
import Badge from './Badge';
import { Mail, MessageCircle, MoreVertical, Loader2, User, Camera, Video, PenTool, Edit3, Share2, Volume2, Sun, HelpCircle, Shield } from 'lucide-react';
import { userService } from '@/lib/services/userService';
import { useState } from 'react';
import InlineDropdown from './InlineDropdown';

interface UserCardProps {
  uid: string;
  name: string;
  email?: string | null;
  role: string;
  baseRole?: string;
  specialty?: string;
  tasks: number;
  productivity: number;
  status: 'online' | 'offline' | 'busy';
  avatar?: string;
  canEditRole?: boolean;
  onRoleUpdate?: () => void;
  onClick?: () => void;
  specialtyOptions?: string[];
}

export default function UserCard({ uid, name, email, role, baseRole, specialty, tasks, productivity, status, avatar, canEditRole, onRoleUpdate, onClick, specialtyOptions = [] }: UserCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Administrador', icon: <Shield size={14} className="text-purple-400" /> },
    { value: 'reader', label: 'Lector', icon: <User size={14} className="text-slate-400" /> },
    ...specialtyOptions.map(s => ({
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

  const handleRoleChange = async (newRole: string) => {
    setIsUpdating(true);
    try {
      if (newRole === 'admin') {
        await userService.updateUserProfile(uid, { baseRole: 'admin', role: 'Administrador', specialty: 'Administrador' });
      } else if (newRole === 'reader') {
        await userService.updateUserProfile(uid, { baseRole: 'reader', role: 'Lector', specialty: '' });
      } else {
        await userService.updateUserProfile(uid, { baseRole: 'collaborator', specialty: newRole, role: newRole });
      }
      if (onRoleUpdate) onRoleUpdate();
    } catch (error) {
      console.error("Error updating role:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentRoleConfig = roleOptions.find(r => r.value === role) || roleOptions[roleOptions.length - 1];
  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-slate-700',
    busy: 'bg-amber-500',
  };

  return (
    <div 
      onClick={onClick}
      className={`glass rounded-[2.5rem] p-6 border border-white/5 hover:border-purple-500/20 hover:bg-purple-500/5 transition-all group relative cursor-pointer overflow-hidden ${isUpdating ? 'pointer-events-none' : ''}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-white/10 flex items-center justify-center text-xl font-bold text-slate-400 group-hover:scale-105 group-hover:bg-slate-700 transition-all overflow-hidden shrink-0">
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full object-cover" />
            ) : (
              name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
            )}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-slate-950 ${statusColors[status]}`}></div>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="text-slate-600 hover:text-white transition-colors relative z-10"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors truncate">
              {name}
            </h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusColors[status]} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">{status}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-0.5" onClick={(e) => e.stopPropagation()}>
            {canEditRole ? (
              <InlineDropdown
                value={specialty || baseRole || 'Otro'}
                options={roleOptions}
                onChange={handleRoleChange}
                trigger={
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-2 hover:border-white/20 transition-all cursor-pointer group/role">
                    {isUpdating ? (
                      <Loader2 size={12} className="animate-spin text-purple-400" />
                    ) : (
                      currentRoleConfig.icon
                    )}
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">
                      {specialty || (baseRole === 'admin' ? 'Administrador' : baseRole) || 'Miembro'}
                    </span>
                  </div>
                }
              />
            ) : (
              <Badge variant="outline" className="text-[10px] py-0 h-5 px-2 border-white/10 bg-white/5 text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5">
                {currentRoleConfig.icon}
                {specialty || (baseRole === 'admin' ? 'Administrador' : baseRole) || role}
              </Badge>
            )}

            {baseRole === 'admin' && specialty !== 'Administrador' && (
              <Badge variant="purple" className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[8px] px-1.5 h-4 uppercase tracking-tighter font-black">
                Admin
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Tareas</p>
          <p className="text-xl font-bold text-white tracking-tight">{tasks}</p>
        </div>
        <div className="h-8 w-px bg-white/5"></div>
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Productividad</p>
          <p className={`text-xl font-bold tracking-tight ${productivity >= 90 ? 'text-emerald-400' : productivity >= 70 ? 'text-cyan-400' : 'text-amber-400'}`}>
            {tasks > 0 ? `${productivity}%` : '100%'}
          </p>
        </div>
      </div>
    </div>
  );
}
