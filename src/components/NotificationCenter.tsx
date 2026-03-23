"use client";
import React, { useRef, useEffect } from 'react';
import { 
  CheckCircle2, 
  MessageSquare, 
  UserPlus, 
  Clock, 
  Trash2,
  Check,
  X,
  ExternalLink,
  BellOff
} from 'lucide-react';
import { Notification, notificationService, NotificationType } from '@/lib/services/notificationService';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationCenterProps {
  notifications: Notification[];
  onClose: () => void;
  userId: string;
}

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'comment':
    case 'mention':
      return <MessageSquare size={16} />;
    case 'assignment':
      return <UserPlus size={16} />;
    case 'approval':
    case 'pending-approval':
      return <CheckCircle2 size={16} />;
    case 'overdue':
    case 'deadline':
      return <Clock size={16} />;
    case 'high-priority':
      return <BellOff size={16} />;
    default:
      return <BellOff size={16} />;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'comment': return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    case 'mention': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'assignment': return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    case 'pending-approval': return 'text-pink-400 bg-pink-400/10 border-pink-400/20';
    case 'approval': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    case 'overdue': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
    case 'deadline': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
};

export default function NotificationCenter({ notifications, onClose, userId }: NotificationCenterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { notificationPermission, requestNotificationPermission } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(userId);
  };

  const handleClearAll = async () => {
    await notificationService.clearAll(userId);
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.isRead && n.id) {
      await notificationService.markAsRead(n.id);
    }
    onClose();
  };

  return (
    <div 
      ref={containerRef}
      className={cn(
        "absolute right-0 top-full mt-4 w-[380px] md:w-[420px] max-h-[500px] flex flex-col",
        "bg-[#0F172A] border border-white/10 rounded-[24px] shadow-[0_20px_90px_rgba(0,0,0,0.8)] z-50 overflow-hidden",
        "animate-in fade-in zoom-in-95 duration-200"
      )}
    >
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.05]">
        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          Centro de Notificaciones 
          {notifications.filter(n => !n.isRead).length > 0 && (
            <span className="bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
              {notifications.filter(n => !n.isRead).length}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <>
              <button 
                onClick={handleMarkAllRead}
                className="p-2 text-slate-500 hover:text-white transition-colors title='Marcar todas como leídas'"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={handleClearAll}
                className="p-2 text-slate-500 hover:text-white transition-colors title='Limpiar todas'"
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {notificationPermission === 'default' && (
        <div className="mx-2 mt-2 p-3 bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/30 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
              <BellOff size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white mb-1">Activar Alertas PWA</p>
              <p className="text-[10px] text-slate-400 leading-tight mb-2">Para recibir avisos con sonido y en la barra de tu celular.</p>
              <button 
                onClick={() => {
                  requestNotificationPermission();
                }}
                className="w-full py-1.5 bg-purple-500 hover:bg-purple-400 text-white text-[9px] font-black uppercase tracking-widest rounded-lg transition-all"
              >
                Habilitar ahora
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-subtle p-2 space-y-1">
        {notifications.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 text-slate-600">
              <BellOff size={24} />
            </div>
            <p className="text-sm font-bold text-white uppercase tracking-tight">No hay notificaciones</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-black opacity-70">Te avisaremos cuando pase algo importante.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n.id}
              className={cn(
                "relative group flex gap-3 p-3 rounded-2xl transition-all border",
                n.isRead 
                  ? "bg-transparent border-transparent opacity-60 hover:opacity-100" 
                  : "bg-white/[0.06] border-white/5 font-medium"
              )}
            >
              {!n.isRead && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-500 rounded-full" />}
              
              <div className="flex-shrink-0 relative">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border",
                  getNotificationColor(n.type)
                )}>
                  {getNotificationIcon(n.type)}
                </div>
                {n.actorPhoto && (
                  <img 
                    src={n.actorPhoto} 
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border border-black shadow-lg" 
                    alt="" 
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-black text-white uppercase tracking-wider truncate">
                    {n.title}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold whitespace-nowrap">
                    {(() => {
                      const date = n.createdAt?.toDate?.() || new Date(n.createdAt);
                      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    })()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  {n.message}
                </p>
                <div className="flex items-center gap-2">
                  {n.link && (
                    <Link 
                      href={n.link}
                      onClick={() => handleNotificationClick(n)}
                      className="text-[9px] font-black uppercase tracking-widest text-purple-400 hover:text-purple-300 flex items-center gap-1 group/link"
                    >
                      Ver detalles
                      <ExternalLink size={10} className="group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                  {!n.isRead && (
                    <button 
                      onClick={() => notificationService.markAsRead(n.id!)}
                      className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                    >
                      Marcar leído
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="p-3 border-t border-white/10 bg-white/[0.05] flex justify-center">
          <Link 
            href="/settings?tab=notifications" 
            onClick={onClose}
            className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            Configurar Notificaciones
          </Link>
        </div>
      )}
    </div>
  );
}
