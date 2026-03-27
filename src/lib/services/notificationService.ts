import { doc, updateDoc, writeBatch, onSnapshot, getDoc, getDocs, collection, query, where, orderBy, serverTimestamp, addDoc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { db, messaging } from "@/lib/firebase";
import { UserProfile, NotificationSettings, userService } from "./userService";

export type NotificationType = 'comment' | 'mention' | 'assignment' | 'approval' | 'pending-approval' | 'overdue' | 'deadline' | 'high-priority';

export interface Notification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: any;
  actorName?: string;
  actorPhoto?: string;
  sourceId?: string; // taskId, projectId, etc.
  tag?: string; // Grouping/Collapsing tag
}

export const notificationService = {
  // Default settings for new users or if not set
  defaultSettings: {
    assignments: true,
    comments: true,
    mentions: true,
    approvals: true,
    deadlines: true,
    overdue: true,
    highPriority: true,
    pushEnabled: false
  } as NotificationSettings,

  async createNotification(data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) {
    try {
      const { userId } = data;
      if (!userId) return null;
      // 1. Fetch recipient profile to check preferences
      const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", userId)));
      if (userDoc.empty) return null;
      
      const profile = userDoc.docs[0].data() as UserProfile;
      const settings = profile.notificationSettings || this.defaultSettings;

      // 2. Map notification type to setting key (Always PLURAL to match Firestore)
      const settingMap: Record<NotificationType, keyof NotificationSettings> = {
        'comment': 'comments',
        'mention': 'mentions',
        'assignment': 'assignments',
        'approval': 'approvals',
        'pending-approval': 'approvals',
        'overdue': 'overdue',
        'deadline': 'deadlines',
        'high-priority': 'highPriority'
      };

      const settingKey = settingMap[data.type];
      
      // 3. Skip ONLY if settings are explicitly present and set to false
      // If a setting is missing, we default to TRUE for better UX
      if (settings && settingKey && settings[settingKey] === false) {
        return null;
      }

      // 4. Create notification in Firestore
      const notificationsRef = collection(db, "notifications");
      const docRef = await addDoc(notificationsRef, {
        ...data,
        isRead: false,
        createdAt: serverTimestamp()
      });

      // 5. Trigger Push Notification via API
      // Solo disparar si el usuario tiene habilitadas las notificaciones Push en sus ajustes
      if (settings?.pushEnabled) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: data.userId,
            title: data.title,
            body: data.message, // Usamos el mensaje como cuerpo del push
            data: {
              url: data.link || '/',
              type: data.type,
              tag: data.tag || 'default'
            }
          })
        }).catch(err => console.error("Push fetch error:", err));
      }

      return docRef;
    } catch (error) {
      console.error("Error creating notification:", error);
      return null;
    }
  },

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      // Client-side sorting to avoid Firestore "Unexpected state" with serverTimestamp fields
      const sorted = notifications.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt instanceof Date ? a.createdAt.getTime() : 0);
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt instanceof Date ? b.createdAt.getTime() : 0);
        return timeB - timeA;
      });

      callback(sorted);
    });
  },

  async markAsRead(id: string) {
    const docRef = doc(db, "notifications", id);
    return updateDoc(docRef, { isRead: true });
  },

  async markAllAsRead(userId: string) {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { isRead: true });
    });
    
    return batch.commit();
  },

  async clearAll(userId: string) {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((d) => {
      batch.delete(d.ref);
    });
    
    return batch.commit();
  },

  async sendWelcomeNotification(userId: string, userName: string) {
    return this.createNotification({
      userId,
      type: 'assignment',
      title: '¡Bienvenido a GoPlanning! 🚀',
      message: `Hola ${userName}, gracias por unirte. Ahora recibirás actualizaciones de tus tareas aquí.`,
      link: '/',
      tag: 'welcome'
    });
  },

  async sendTestNotification(userId: string) {
    return this.createNotification({
      userId,
      type: 'high-priority',
      title: 'Notificación de Prueba ✅',
      message: 'Esto confirma que tus notificaciones PWA están configuradas correctamente y el icono se ve genial.',
      link: '/settings',
      tag: 'test_notification'
    });
  }
};
