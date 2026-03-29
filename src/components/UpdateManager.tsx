"use client";

import React, { useEffect, useState } from 'react';
import { RefreshCw, Zap, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UpdateManager() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // 1. Monitor for updates on any existing registration
      navigator.serviceWorker.getRegistration('/').then(reg => {
        if (reg) {
          setRegistration(reg);
          
          // Check if there's already an update waiting (e.g. from a previous load)
          if (reg.waiting) {
            setShowUpdateModal(true);
          }

          // Listen for new updates found
          reg.onupdatefound = () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.onstatechange = () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New SW is installed and waiting to take over
                  setShowUpdateModal(true);
                }
              };
            }
          };
        }
      });

      // 2. Listen for 'controllerchange' to reload pages once skipWaiting() takes effect
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Force skip-waiting message
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // Fallback reload
      window.location.reload();
    }
  };

  return (
    <AnimatePresence>
      {showUpdateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 sm:p-4 pointer-events-auto">
          {/* Backdrop with extreme glassmorphism */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm overflow-hidden"
          >
            {/* Pulsing Gradient Glow */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 rounded-[42px] blur-2xl opacity-20 animate-pulse pointer-events-none" />
            
            <div className="relative bg-[#0F172A] border border-white/10 rounded-[40px] p-8 sm:p-6 shadow-2xl overflow-hidden group">
              {/* Background ambient light */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="flex flex-col items-center text-center">
                
                {/* Visual Icon Header with Float animation */}
                <motion.div 
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="relative mb-8"
                >
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl rotate-6 group-hover:rotate-0 transition-transform duration-500">
                    <RefreshCw size={44} className="text-white animate-spin-slow" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center shadow-lg border-4 border-[#0F172A]">
                    <Zap size={18} className="text-white fill-current" />
                  </div>
                </motion.div>

                <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-3 flex items-center gap-2">
                  Actualización Lista
                  <Sparkles size={20} className="text-amber-400 fill-current" />
                </h2>
                
                <p className="text-slate-400 text-sm leading-relaxed mb-10 px-2 sm:px-0">
                  Hemos mejorado tu experiencia. Para activar las optimizaciones y nuevas funciones, es necesario reiniciar la aplicación.
                </p>

                <div className="w-full space-y-4">
                  <button
                    onClick={handleUpdate}
                    className="w-full py-5 bg-white text-slate-900 font-black uppercase tracking-widest text-[11px] rounded-[22px] hover:bg-slate-100 transition-all active:scale-[0.97] shadow-2xl shadow-white/10 flex items-center justify-center gap-3"
                  >
                    Actualizar Ahora
                  </button>
                  
                  <div className="opacity-40 hover:opacity-100 transition-opacity">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em]">
                      Tus datos están sincronizados en la nube
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
