"use client";
import { X, Mail, Phone, Shield, User, Camera, Video, PenTool, Edit3, Share2, Volume2, Sun, HelpCircle } from 'lucide-react';
import { UserProfile } from '@/lib/services/userService';
import Badge from './Badge';
import UserAvatar from './UserAvatar';

interface MemberDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  tasks: number;
  productivity: number;
}

export default function MemberDetailModal({ isOpen, onClose, user, tasks, productivity }: MemberDetailModalProps) {
  if (!isOpen || !user) return null;

  const roleIcons: Record<string, React.ReactNode> = {
    'admin': <Shield size={18} className="text-purple-400" />,
    'reader': <User size={18} className="text-slate-400" />,
    'Fotógrafo': <Camera size={18} className="text-cyan-400" />,
    'Videógrafo': <Video size={18} className="text-emerald-400" />,
    'Diseñador Gráfico': <Edit3 size={18} className="text-rose-400" />,
    'Redactor': <PenTool size={18} className="text-amber-400" />,
    'Social Media': <Share2 size={18} className="text-pink-400" />,
    'Sonido': <Volume2 size={18} className="text-indigo-400" />,
    'Iluminación': <Sun size={18} className="text-yellow-400" />,
  };

  const getRoleIcon = (role: string) => {
    return roleIcons[role] || <HelpCircle size={18} className="text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Banner with Gradient */}
        <div className="h-32 bg-gradient-to-r from-purple-600/20 via-purple-500/10 to-transparent relative">
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-900/50 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-white/5"
            >
                <X size={20} />
            </button>
        </div>

        <div className="px-8 pb-8 -mt-12 relative">
            <div className="flex items-center gap-6 mb-8">
              <UserAvatar 
                src={user.photoURL} 
                name={user.fullName || user.displayName} 
                size="xl" 
                rounded="rounded-2xl" 
                className="ring-4 ring-slate-900 shadow-2xl"
              />
              <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-2xl font-black text-white tracking-tight">
                          {user.fullName || user.displayName || 'Miembro del Equipo'}
                      </h2>
                  </div>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-[10px] py-0 h-5 px-2 border-white/10 bg-white/5 text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5 w-fit">
                        {getRoleIcon(user.specialty || (user.baseRole === 'admin' ? 'admin' : 'reader'))}
                        {user.specialty || (user.baseRole === 'admin' ? 'Administrador' : 'Lector')}
                    </Badge>
                  </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Tareas Asignadas</p>
                    <p className="text-2xl font-black text-white">{tasks}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Productividad</p>
                    <p className={`text-2xl font-black ${productivity >= 90 ? 'text-emerald-400' : productivity >= 70 ? 'text-cyan-400' : 'text-amber-400'}`}>
                        {tasks > 0 ? `${productivity}%` : '100%'}
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                        <Mail size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Email</p>
                        <p className="text-sm font-bold truncate max-w-[200px]">{user.email || 'No proporcionado'}</p>
                    </div>
                </div>

                {user.phoneNumber && (
                    <div className="flex items-center gap-3 text-slate-300">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">
                            <Phone size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Teléfono</p>
                            <p className="text-sm font-bold">{user.phoneNumber}</p>
                        </div>
                    </div>
                )}

                {user.bio && (
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 mt-4">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Biografía / Notas</p>
                        <p className="text-sm text-slate-300 leading-relaxed font-medium">
                            {user.bio}
                        </p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
