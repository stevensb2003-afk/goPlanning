"use client";
import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 3500); // Start exit animation slightly before context removes it
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300); // Match animation duration
  };

  const config = {
    success: {
      icon: <CheckCircle2 size={20} className="text-emerald-400" />,
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      glow: "shadow-emerald-500/20"
    },
    error: {
      icon: <XCircle size={20} className="text-rose-400" />,
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      glow: "shadow-rose-500/20"
    },
    warning: {
      icon: <AlertCircle size={20} className="text-amber-400" />,
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      glow: "shadow-amber-500/20"
    },
    info: {
      icon: <Info size={20} className="text-cyan-400" />,
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
      glow: "shadow-cyan-500/20"
    }
  }[type];

  return (
    <div className={`fixed bottom-8 right-8 z-[200] flex items-center gap-4 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-right-10 fade-in ${isExiting ? 'slide-out-to-right-10 fade-out' : ''} ${config.bg} ${config.border} ${config.glow}`}>
      <div className="flex-shrink-0">
        {config.icon}
      </div>
      <p className="text-sm font-medium text-white tracking-wide">
        {message}
      </p>
      <button 
        onClick={handleClose}
        className="ml-4 p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
