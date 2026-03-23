import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  doc,
  setDoc,
  where,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface NotificationSettings {
  assignments: boolean;
  comments: boolean;
  mentions: boolean;
  approvals: boolean;
  deadlines: boolean;
  overdue: boolean;
  highPriority: boolean;
  pushEnabled: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  fullName?: string;
  phoneNumber?: string;
  onboarded: boolean;
  role?: string; 
  baseRole?: 'admin' | 'collaborator' | 'reader';
  specialty?: string;
  bio?: string;
  fcmToken?: string;
  notificationSettings?: NotificationSettings;
}

export const userService = {
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
  },

  async updateUserProfile(uid: string, data: Partial<UserProfile>) {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, data, { merge: true });
  },

  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  },

  async getAdmins(): Promise<UserProfile[]> {
    try {
      const q = query(collection(db, "users"), where("baseRole", "==", "admin"));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      console.error("Error fetching admins:", error);
      return [];
    }
  }
};
