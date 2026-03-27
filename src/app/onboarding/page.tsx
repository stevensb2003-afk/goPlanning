"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { UserCircle, Phone, ArrowRight, Check, Briefcase } from "lucide-react";
import { configService } from "@/lib/services/configService";
import { notificationService } from "@/lib/services/notificationService";

export default function OnboardingPage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    const fetchConfig = async () => {
      const config = await configService.getConfig();
      setSpecialties(config.collaboratorSpecialties || []);
    };
    fetchConfig();
  }, []);

  // Sync state from profile if it exists (e.g. on remount)
  useEffect(() => {
    if (profile) {
      if (profile.fullName && !fullName) setFullName(profile.fullName);
      if (profile.phoneNumber && !phone) setPhone(profile.phoneNumber.replace('+506', '').trim());
      if (profile.specialty && !role) setRole(profile.specialty);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        fullName: fullName || user.displayName,
        phoneNumber: `+506${phone.replace(/\D/g, '')}`,
        role: role,
        baseRole: profile?.baseRole || 'collaborator',
        specialty: role,
        onboarded: true,
        createdAt: new Date().toISOString(),
      };
      
      await setDoc(doc(db, "users", user.uid), userData); 
      
      // Set flag for welcome notification once permission is granted
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingWelcomeNotification', 'true');
      }
      
      // Proactive redirect to clear the "Hanging" state
      router.push("/");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert("Error al registrar: " + error.message);
      setIsSubmitting(false); 
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full animate-pulse"></div>
      <div className="absolute bottom-[20%] left-[-5%] w-[30%] h-[30%] bg-cyan-600/10 blur-[100px] rounded-full animate-pulse decoration-3000"></div>

      <div className="w-full max-w-xl z-10">
        <form onSubmit={handleSubmit} className="glass rounded-[40px] p-8 md:p-12 border border-white/10 shadow-2xl">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Casi Listos 🚀</h2>
            <p className="text-slate-400 font-medium">Completa tu perfil para empezar a gestionar tus proyectos.</p>
          </div>

          <div className="space-y-8">
            {/* Full Name Field */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Nombre Completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <UserCircle size={20} className="text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder={user.displayName || "Tu nombre..."}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl pl-14 pr-6 text-white font-semibold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Teléfono Celular</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Phone size={20} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                </div>
                <div className="absolute inset-y-0 left-12 flex items-center pl-2 pointer-events-none">
                  <span className="text-slate-400 font-bold border-r border-white/10 pr-3 mr-1">+506</span>
                </div>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{8}"
                  maxLength={8}
                  placeholder="Tu número (8 dígitos)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-16 bg-white/5 border border-white/5 rounded-2xl pl-28 pr-6 text-white font-bold tracking-[0.1em] placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:bg-white/10 transition-all placeholder:tracking-normal"
                />
              </div>
              <p className="text-[10px] text-slate-500 ml-2 font-medium italic">Costa Rica (Código de área automático)</p>
            </div>

            {/* Role Field */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-2">Tu Especialidad / Rol</label>
              <div className="relative" id="onboarding-role-dropdown">
                <div 
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className={`w-full h-16 bg-white/5 border ${isRoleDropdownOpen ? 'border-emerald-500/50 ring-2 ring-emerald-500/20' : 'border-white/5'} rounded-2xl flex items-center px-5 cursor-pointer hover:bg-white/10 transition-all group`}
                >
                  <Briefcase size={20} className={`mr-4 ${isRoleDropdownOpen ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className={`text-lg font-bold ${role ? 'text-white' : 'text-slate-600 italic'}`}>
                    {role || "Selecciona tu rol principal..."}
                  </span>
                  <div className="ml-auto text-slate-500">
                    <svg className={`w-4 h-4 fill-current transition-transform duration-300 ${isRoleDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                  </div>
                </div>

                {isRoleDropdownOpen && (
                  <div className="absolute z-[100] top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 duration-300 max-h-64 overflow-y-auto scrollbar-subtle">
                    {specialties.map((r) => (
                      <div 
                        key={r}
                        onClick={() => {
                          setRole(r);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full p-4 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${role === r ? 'bg-emerald-500/20 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${role === r ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-slate-700'}`} />
                        <span className="font-bold text-sm uppercase tracking-wide">{r}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-4">
              <button
                type="submit"
                disabled={isSubmitting || !phone || phone.length < 8 || !role}
                className="w-full sm:flex-1 h-16 premium-gradient text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale group"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Completar Registro
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => logout()}
                className="w-full sm:w-1/3 h-16 bg-white/5 border border-white/10 text-slate-400 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 hover:text-white transition-all active:scale-[0.98]"
              >
                Volver
              </button>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check size={14} className="text-green-400" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
