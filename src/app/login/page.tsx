"use client";

import { useAuth } from "@/context/AuthContext";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 blur-[120px] rounded-full"></div>
      
      <div className="w-full max-w-md z-10">
        <div className="glass rounded-[40px] p-10 border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-colors"></div>
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="relative group/logo transition-transform hover:scale-105 duration-500">
              <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full scale-150 group-hover/logo:bg-purple-500/30 transition-colors"></div>
              
              <div className="flex items-center justify-center gap-4 relative z-10 py-4">
                <div className="w-12 h-12 md:w-14 md:h-14 premium-gradient rounded-2xl shadow-xl flex items-center justify-center font-black text-white text-2xl md:text-3xl">G</div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white uppercase italic">GoPlanning</h1>
              </div>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-6 ml-[0.4em] opacity-80 gradient-text">
              Inteligencia Audiovisual
            </p>
          </div>

          <div className="space-y-6">
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full h-14 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-lg shadow-white/5 disabled:opacity-50"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.27.81-.57z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continuar con Google
            </button>
            
            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acceso Seguro</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>
            
            <p className="text-[10px] text-center text-slate-500 leading-relaxed font-medium">
              Al continuar, aceptas nuestros <span className="text-slate-400">Términos de Servicio</span> y <span className="text-slate-400">Política de Privacidad</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
