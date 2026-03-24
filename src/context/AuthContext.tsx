"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { userService, UserProfile } from "@/lib/services/userService";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isCollaborator: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  requestNotificationPermission: () => Promise<void>;
  fcmToken: string | null;
  notificationPermission: NotificationPermission;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { requestPermission, syncToken, token, permission } = usePushNotifications(user?.uid);

  // Sync token automatically if permission is already granted
  useEffect(() => {
    if (user && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      syncToken();
    }
  }, [user]);

  // Setup foreground message listener
  useEffect(() => {
    if (!messaging) return;
    
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Foreground message received:", payload);
      
      // Only show if the user has push enabled and we have permission
      if (Notification.permission === 'granted' && profile?.notificationSettings?.pushEnabled) {
        const title = payload.notification?.title || "Nueva notificación";
        const options = {
          body: payload.notification?.body || "",
          icon: "/logo-full.png",
          badge: "/favicon.png",
          data: payload.data
        };
        
        // Show native notification
        new Notification(title, options);
      }
    });

    return () => unsubscribe();
  }, [profile?.notificationSettings?.pushEnabled]);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      // Clean up previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (authenticatedUser) {
        // Enforce loading state TRUE before fetching profile to prevent redirect races
        setLoading(true);
        setUser(authenticatedUser);
        
        unsubscribeProfile = onSnapshot(
          doc(db, "users", authenticatedUser.uid),
          { includeMetadataChanges: true },
          (snapshot) => {
            // Ignore optimistic local writes that haven't been confirmed by the server.
            // This stops the app from redirecting prematurely.
            if (snapshot.metadata.hasPendingWrites) {
              return;
            }

            if (snapshot.exists()) {
              setProfile(snapshot.data() as UserProfile);
            } else {
              setProfile(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error in profile listener:", error);
            setLoading(false);
          }
        );
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []); // Run only once on mount

  // Centralized redirection logic
  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (pathname !== "/login") {
        router.replace("/login");
      }
    } else {
      // User is authenticated
      if (profile) {
        if (!profile.onboarded) {
          if (pathname !== "/onboarding") {
            router.replace("/onboarding");
          }
        } else {
          // User is onboarded
          if (pathname === "/login" || pathname === "/onboarding") {
            router.replace("/");
          }
        }
      } else {
        // User authenticated but no profile yet -> must go to onboarding
        if (pathname !== "/onboarding") {
          router.replace("/onboarding");
        }
      }
    }
  }, [user, profile, loading, pathname, router]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const isAdmin = profile?.baseRole === 'admin' || profile?.email === 'info@v-creations.com';
  const isCollaborator = profile?.baseRole === 'collaborator';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      isAdmin, 
      isCollaborator, 
      loading, 
      signInWithGoogle, 
      logout,
      requestNotificationPermission: requestPermission,
      fcmToken: token,
      notificationPermission: permission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
