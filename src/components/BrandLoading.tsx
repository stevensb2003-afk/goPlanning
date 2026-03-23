"use client";

import React from 'react';

export default function BrandLoading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950">
      <div className="relative flex flex-col items-center">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full animate-pulse"></div>
        
        {/* Full Logo Container */}
        <div className="relative z-10 animate-in fade-in zoom-in duration-700">
          <img 
            src="/logo-full.png" 
            alt="GoPlanning" 
            className="h-16 md:h-20 w-auto object-contain animate-pulse-gentle"
          />
        </div>
        
        {/* Loading Indicator */}
        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent w-full animate-shimmer"></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-[0.3em]">
            Iniciando Experiencia
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.9; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
        .animate-pulse-gentle {
          animation: pulse-gentle 3s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
