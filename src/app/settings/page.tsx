"use client";
import { User, Bell, Shield, Palette, Globe, Save, LogOut, Settings as SettingsIcon, Plus, Trash2, Pencil, Users, Briefcase, CheckSquare, X, Check, ChevronDown, UserCircle, Menu as MenuIcon, Mail, Phone, Camera, CheckCircle2, MessageSquare } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useMemo } from 'react';
import { configService, AppConfig } from '@/lib/services/configService';
import { userService, UserProfile, NotificationSettings } from '@/lib/services/userService';
import { notificationService } from '@/lib/services/notificationService';
import InlineDropdown from '@/components/InlineDropdown';
import UserAvatar from '@/components/UserAvatar';

const NotificationToggle = ({ label, description, checked, onChange, disabled }: { 
  label: string, 
  description: string, 
  checked: boolean, 
  onChange: (val: boolean) => void,
  disabled?: boolean
}) => (
  <div className="flex items-center justify-between gap-6 group">
    <div className="flex-1 min-w-0">
      <h5 className="text-sm font-bold text-white tracking-tight uppercase tracking-widest text-[11px] mb-0.5">{label}</h5>
      <p className="text-xs text-slate-500 leading-relaxed truncate group-hover:text-slate-400 transition-colors">{description}</p>
    </div>
    <button
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        checked ? 'bg-purple-600 shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-slate-800 border border-white/5'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 transform ${
        checked ? 'left-7 shadow-lg' : 'left-1'
      }`} />
    </button>
  </div>
);

const ConfigTable = ({ items = [], onUpdate, placeholder }: {
  items?: string[],
  onUpdate: (items: string[]) => void,
  placeholder: string
}) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim() && !items.includes(newItem.trim())) {
      onUpdate([...items, newItem.trim()]);
      setNewItem('');
    }
  };

  const startEdit = (index: number, value: string) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editingValue.trim()) {
      const newItems = [...items];
      newItems[editingIndex] = editingValue.trim();
      onUpdate(newItems);
      setEditingIndex(null);
    }
  };

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nombre</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item, index) => (
              <tr key={item + index} className="group hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingIndex === index ? (
                    <input 
                      autoFocus
                      type="text"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' ? saveEdit() : e.key === 'Escape' && setEditingIndex(null)}
                      className="bg-slate-900 border border-purple-500/30 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none w-full max-w-[300px]"
                    />
                  ) : (
                    <span className="text-sm text-slate-300">{item}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end items-center gap-2">
                    {editingIndex === index ? (
                      <>
                        <button onClick={saveEdit} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingIndex(null)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(index, item)} className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all sm:opacity-0 sm:group-hover:opacity-100">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => onUpdate(items.filter((_, i) => i !== index))} className="p-1.5 rounded-lg bg-red-500/10 text-red-500/70 hover:text-red-400 transition-all sm:opacity-0 sm:group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={2} className="px-6 py-12 text-center text-slate-500 italic text-sm">
                  No hay elementos en esta lista.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row gap-3">
        <input 
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl py-2 px-4 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
        />
        <button 
          onClick={handleAdd}
          disabled={!newItem.trim()}
          className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>Añadir</span>
        </button>
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const { profile, logout, isAdmin, requestNotificationPermission } = useAuth();
  const { toggleSidebar } = useUI();
  const [activeTab, setActiveTab] = useState('perfil');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [configSubTab, setConfigSubTab] = useState<'general' | 'specialties' | 'projects' | 'tasks'>('general');
  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
    bio: ''
  });

  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    assignments: true,
    comments: true,
    mentions: true,
    approvals: true,
    deadlines: true,
    overdue: true,
    highPriority: true,
    pushEnabled: true
  });

  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (profile?.notificationSettings) {
      setNotificationSettings(profile.notificationSettings as NotificationSettings);
    }
  }, [profile]);

  const handleNotificationSettingsSave = async (newSettings: Partial<NotificationSettings>) => {
    if (!profile?.uid) return;
    const updated = { ...notificationSettings, ...newSettings } as NotificationSettings;
    setNotificationSettings(updated);
    try {
      if (newSettings.pushEnabled && profile?.uid) {
        await requestNotificationPermission();
      }
      await userService.updateUserProfile(profile.uid, { notificationSettings: updated });
      setNotification({ message: 'Preferencias de notificación actualizadas', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Error al actualizar preferencias', type: 'error' });
    }
  };

  const handleSendTestNotification = async () => {
    if (!profile?.uid) return;
    try {
      await notificationService.sendTestNotification(profile.uid);
      setNotification({ message: 'Notificación de prueba enviada', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Error al enviar prueba', type: 'error' });
    }
  };

  const hasChanges = 
    profileData.fullName !== (profile?.fullName || '') ||
    profileData.phoneNumber !== (profile?.phoneNumber || '') ||
    profileData.bio !== (profile?.bio || '');

  const handleProfileSave = async () => {
    if (!profile?.uid) return;
    try {
      await userService.updateUserProfile(profile.uid, profileData);
      setNotification({ message: 'Perfil actualizado con éxito', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Error al actualizar el perfil', type: 'error' });
    }
  };

  const handleConfigUpdate = async (newConfig: Partial<AppConfig>) => {
    if (!config) return;
    
    const sortedNewConfig: Partial<AppConfig> = {};
    for (const key in newConfig) {
      const val = (newConfig as any)[key];
      if (Array.isArray(val)) {
        (sortedNewConfig as any)[key] = [...val].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      } else {
        (sortedNewConfig as any)[key] = val;
      }
    }

    const updated = { ...config, ...sortedNewConfig };
    setConfig(updated);
    try {
      await configService.updateConfig(sortedNewConfig);
      setNotification({ message: 'Configuración actualizada', type: 'success' });
    } catch (error) {
      setNotification({ message: 'Error al actualizar', type: 'error' });
    }
  };
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const fetchConfig = async () => {
      const data = await configService.getConfig();
      const sortedData: AppConfig = {
        projectTypes: [...data.projectTypes].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
        taskTypes: [...data.taskTypes].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })),
        collaboratorSpecialties: [...(data.collaboratorSpecialties || [])].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
      };
      setConfig(sortedData);
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'usuarios' && isAdmin) {
      const fetchUsers = async () => {
        setIsUsersLoading(true);
        const data = await userService.getAllUsers();
        setUsers(data);
        setIsUsersLoading(false);
      };
      fetchUsers();
    }
  }, [activeTab, isAdmin]);

  // Loading is handled by MainLayoutWrapper

  const tabs = useMemo(() => [
    { id: 'perfil', label: 'Perfil', icon: User },
    ...(isAdmin ? [
      { id: 'usuarios', label: 'Usuarios', icon: Users },
      { id: 'config', label: 'Configuración', icon: SettingsIcon }
    ] : []),
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'apariencia', label: 'Apariencia', icon: Palette },
  ], [isAdmin]);

  return (
    <>
      <main className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2.5 bg-slate-900 border border-white/10 rounded-xl text-slate-400 hover:text-white md:hidden shadow-lg active:scale-95 transition-all"
            >
              <MenuIcon size={20} />
            </button>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-white tracking-tight">Ajustes</h1>
              <p className="text-slate-400 text-sm">Gestiona tu cuenta, preferencias y configuraciones generales.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Tabs Sidebar */}
            <div className="lg:col-span-1 space-y-2">
              {tabs.map((tab: any) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    activeTab === tab.id 
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold' 
                      : 'text-slate-500 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3 space-y-8">
              <section className="glass rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full"></div>
                
                {activeTab === 'perfil' && (
                  <div className="space-y-6 relative">
                    <div className="flex items-center gap-6 pb-6 border-b border-white/5">
                      <UserAvatar 
                        src={profile?.photoURL} 
                        name={profile?.fullName || profile?.displayName} 
                        size="xl" 
                        rounded="rounded-full" 
                        className="w-20 h-20 border-2 border-purple-500/30 shadow-2xl"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-white">{profile?.fullName}</h3>
                        <p className="text-sm text-slate-400">{profile?.email}</p>
                        <button className="text-xs font-bold text-cyan-400 mt-2 hover:underline tracking-wide uppercase">Cambiar Foto</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nombre Completo</label>
                        <input 
                          type="text" 
                          value={profileData.fullName}
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Teléfono</label>
                        <input 
                          type="text" 
                          value={profileData.phoneNumber}
                          onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                          className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Bio / Rol</label>
                        <textarea 
                          rows={3}
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          placeholder="Cuéntanos un poco sobre ti..."
                          className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button 
                        onClick={handleProfileSave}
                        disabled={!hasChanges}
                        className={`px-8 py-3 rounded-2xl text-sm font-bold text-white shadow-xl transition-all flex items-center gap-2 ${
                          hasChanges 
                            ? 'premium-gradient shadow-purple-500/20 hover:scale-105 active:scale-95 cursor-pointer' 
                            : 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Save size={18} />
                        Guardar Cambios
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'usuarios' && isAdmin && (
                  <div className="space-y-6 relative">
                    <div className="pb-4 border-b border-white/5">
                      <h3 className="text-xl font-bold text-white">Gestión de Usuarios</h3>
                      <p className="text-sm text-slate-400 mt-1">Administra los roles y especialidades de los miembros del equipo.</p>
                    </div>

                    {isUsersLoading ? (
                      <div className="py-20 flex justify-center">
                        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {users.map((u) => (
                          <div key={u.uid} className="glass p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-white/10 group">
                            <div className="flex items-center gap-4">
                              <UserAvatar 
                                src={u.photoURL} 
                                name={u.fullName || u.displayName} 
                                size="lg" 
                                rounded="rounded-full" 
                                className="border border-white/10 shadow-lg"
                              />
                              <div>
                                <h4 className="font-bold text-white">{u.fullName || u.displayName || 'Usuario sin nombre'}</h4>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Rol Base</label>
                                <InlineDropdown 
                                  value={u.baseRole || 'collaborator'}
                                  onChange={async (newRole: any) => {
                                    await userService.updateUserProfile(u.uid, { baseRole: newRole });
                                    setUsers(users.map(user => user.uid === u.uid ? { ...user, baseRole: newRole } : user));
                                    setNotification({ message: 'Rol actualizado con éxito', type: 'success' });
                                  }}
                                  options={[
                                    { value: 'admin', label: 'Admin' },
                                    { value: 'collaborator', label: 'Colaborador' },
                                    { value: 'reader', label: 'Lector' }
                                  ]}
                                  trigger={
                                    <div className={`flex items-center justify-between gap-3 bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white min-w-[120px] hover:border-white/20 transition-all ${u.email === 'stevensb.2003@gmail.com' && profile?.email !== 'stevensb.2003@gmail.com' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                                      <span className="capitalize">{u.baseRole || 'Colaborador'}</span>
                                      <ChevronDown size={14} className="text-slate-500" />
                                    </div>
                                  }
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Especialidad</label>
                                <InlineDropdown 
                                  value={u.specialty || ''}
                                  onChange={async (newSpecialty: string) => {
                                    await userService.updateUserProfile(u.uid, { specialty: newSpecialty, role: newSpecialty });
                                    setUsers(users.map(user => user.uid === u.uid ? { ...user, specialty: newSpecialty } : user));
                                    setNotification({ message: 'Especialidad actualizada con éxito', type: 'success' });
                                  }}
                                  options={[
                                    { value: '', label: 'Sin especialidad' },
                                    ...(config?.collaboratorSpecialties?.map(s => ({ value: s, label: s })) || [])
                                  ]}
                                  trigger={
                                    <div className="flex items-center justify-between gap-3 bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-xs text-white min-w-[160px] cursor-pointer hover:border-cyan-500/30 transition-all">
                                      <span className="truncate max-w-[120px]">{u.specialty || 'Sin especialidad'}</span>
                                      <ChevronDown size={14} className="text-slate-500" />
                                    </div>
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'config' && isAdmin && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                          <SettingsIcon size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white tracking-tight">Listas de Sistema</h3>
                          <p className="text-xs text-slate-500">Gestiona los tipos de colaboradores, proyectos y tareas.</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap bg-slate-900/50 p-1.5 rounded-2xl border border-white/10 self-start relative z-10">
                        {[
                          { id: 'general' as const, label: 'General', icon: <Globe size={14} className="pointer-events-none" /> },
                          { id: 'specialties' as const, label: 'Especialidades', icon: <Users size={14} className="pointer-events-none" /> },
                          { id: 'projects' as const, label: 'Proyectos', icon: <Briefcase size={14} className="pointer-events-none" /> },
                          { id: 'tasks' as const, label: 'Tareas', icon: <CheckSquare size={14} className="pointer-events-none" /> }
                        ].map(tab => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfigSubTab(tab.id as any);
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative z-20 ${
                              configSubTab === tab.id 
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                          >
                            {tab.icon}
                            <span className="pointer-events-none">{tab.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pb-20">
                      {configSubTab === 'general' ? (
                        <div className="glass p-8 rounded-3xl border border-white/5 bg-white/[0.02] space-y-6">
                          <div className="space-y-2">
                            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-4">Enlace de Invitación</h4>
                            <p className="text-sm text-slate-400 mb-6">Este es el enlace base que se utiliza para invitar a nuevos colaboradores al equipo.</p>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                              <input 
                                type="text" 
                                value={config?.inviteLink || ''}
                                onChange={(e) => setConfig(prev => prev ? { ...prev, inviteLink: e.target.value } : null)}
                                placeholder="https://tu-dominio.com/signup"
                                className="flex-1 bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                              />
                              <button 
                                onClick={() => handleConfigUpdate({ inviteLink: config?.inviteLink })}
                                className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                              >
                                <Save size={18} />
                                <span>Actualizar Link</span>
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 italic mt-2">
                              * Asegúrate de incluir el protocolo (http:// o https://). El sistema le añadirá automáticamente un ID de referencia.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <ConfigTable 
                          items={
                            configSubTab === 'specialties' ? config?.collaboratorSpecialties :
                            configSubTab === 'projects' ? config?.projectTypes :
                            config?.taskTypes
                          }
                          onUpdate={(items) => handleConfigUpdate({
                            [configSubTab === 'specialties' ? 'collaboratorSpecialties' : 
                            configSubTab === 'projects' ? 'projectTypes' : 'taskTypes']: items
                          })}
                          placeholder={`Nombre de ${
                            configSubTab === 'specialties' ? 'especialidad' : 
                            configSubTab === 'projects' ? 'tipo de proyecto' : 
                            'tipo de tarea'
                          }...`}
                        />
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'notificaciones' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight mb-1">Preferencias de Notificación</h3>
                        <p className="text-sm text-slate-400">Personaliza cómo y cuándo quieres recibir actualizaciones.</p>
                      </div>
                      <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl px-4 py-2 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${notificationSettings.pushEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                          {notificationSettings.pushEnabled ? 'Push Activo' : 'Push Desactivado'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Canales */}
                      <div className="glass p-8 rounded-[32px] border border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
                            <Globe size={20} />
                          </div>
                          <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Canales Principales</h4>
                        </div>
                        <div className="space-y-8">
                          <NotificationToggle 
                            label="Notificaciones Push" 
                            description="Alertas en tiempo real en tu navegador."
                            checked={notificationSettings.pushEnabled}
                            onChange={(val) => handleNotificationSettingsSave({ pushEnabled: val })}
                          />
                          <NotificationToggle 
                            label="Alta Prioridad" 
                            description="Solo interrumpir con tareas críticas."
                            checked={notificationSettings.highPriority}
                            onChange={(val) => handleNotificationSettingsSave({ highPriority: val })}
                          />
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-white/5">
                          <button
                            onClick={handleSendTestNotification}
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                          >
                            <Bell size={16} className="text-purple-400" />
                            Probar Notificación
                          </button>
                        </div>
                      </div>

                      {/* Tareas */}
                      <div className="glass p-8 rounded-[32px] border border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                            <Briefcase size={20} />
                          </div>
                          <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Gestión de Tareas</h4>
                        </div>
                        <div className="space-y-8">
                          <NotificationToggle 
                            label="Nuevas Asignaciones" 
                            description="Cuando se te asigne responsable de una tarea."
                            checked={notificationSettings.assignments}
                            onChange={(val) => handleNotificationSettingsSave({ assignments: val })}
                          />
                          <NotificationToggle 
                            label="Cambios de Estado" 
                            description="Actualizaciones sobre el progreso de tus tareas."
                            checked={notificationSettings.approvals} // Using approvals as a proxy or just call it approvals
                            onChange={(val) => handleNotificationSettingsSave({ approvals: val })}
                          />
                        </div>
                      </div>

                      {/* Colaboración */}
                      <div className="glass p-8 rounded-[32px] border border-white/5 bg-white/[0.02] lg:col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                          <div className="w-10 h-10 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20">
                            <MessageSquare size={20} />
                          </div>
                          <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Interacción y Equipo</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <NotificationToggle 
                            label="Menciones Directas" 
                            description="Cuando alguien te etiquete en un comentario."
                            checked={notificationSettings.mentions}
                            onChange={(val) => handleNotificationSettingsSave({ mentions: val })}
                          />
                          <NotificationToggle 
                            label="Nuevos Comentarios" 
                            description="Hilos de conversación en tareas que sigues."
                            checked={notificationSettings.comments}
                            onChange={(val) => handleNotificationSettingsSave({ comments: val })}
                          />
                          <NotificationToggle 
                            label="Fechas Límite" 
                            description="Recordatorios antes de que expire una tarea."
                            checked={notificationSettings.deadlines}
                            onChange={(val) => handleNotificationSettingsSave({ deadlines: val })}
                          />
                          <NotificationToggle 
                            label="Tareas Vencidas" 
                            description="Alertas persistentes para tareas fuera de plazo."
                            checked={notificationSettings.overdue}
                            onChange={(val) => handleNotificationSettingsSave({ overdue: val })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Success Notification */}
              {notification && (
                <div className="fixed bottom-8 right-8 animate-in slide-in-from-right duration-300 z-50">
                  <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border ${
                    notification.type === 'success' 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  } backdrop-blur-xl shadow-2xl`}>
                    <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`} />
                    <span className="font-bold text-sm tracking-tight">{notification.message}</span>
                  </div>
                </div>
              )}

              {activeTab === 'perfil' && (
                <section className="glass rounded-3xl p-8 border border-red-500/10">
                  <h4 className="text-sm font-bold text-red-400 mb-4 flex items-center gap-2">
                    <LogOut size={16} />
                    Zona de Peligro
                  </h4>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-sm text-slate-400 font-medium">Cerrar sesión en todos los dispositivos o desactivar cuenta.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Tu información se mantendrá segura en nuestra base de datos.</p>
                    </div>
                    <button 
                      onClick={logout}
                      className="px-6 py-2 rounded-xl border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-all uppercase tracking-widest"
                    >
                      Cerrar Sesión Activa
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
      </main>
    </>
  );
}
