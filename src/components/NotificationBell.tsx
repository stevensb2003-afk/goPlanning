"use client";
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { notificationService, Notification } from '@/lib/services/notificationService';
import { useAuth } from '@/context/AuthContext';
import NotificationCenter from '@/components/NotificationCenter';
import { cn } from '@/lib/utils';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = notificationService.subscribeToNotifications(user.uid, (data) => {
      setNotifications(data);
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2.5 rounded-xl transition-all border outline-none",
          isOpen 
            ? "bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20" 
            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
        )}
      >
        <Bell size={20} className={cn(unreadCount > 0 && !isOpen && "animate-pulse")} />
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0a0a0c] shadow-lg animate-in zoom-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationCenter 
          notifications={notifications} 
          onClose={() => setIsOpen(false)} 
          userId={user?.uid || ''}
        />
      )}
    </div>
  );
}
