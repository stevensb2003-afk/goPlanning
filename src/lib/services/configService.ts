import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AppConfig {
  projectTypes: string[];
  taskTypes: string[];
  collaboratorSpecialties: string[];
}

const DEFAULT_CONFIG: AppConfig = {
  projectTypes: ["Seminario", "Campamento", "Cumbre", "Actividad masiva", "Evangelización"],
  taskTypes: ["Video corto", "reel", "historia", "post", "documento", "presentación", "logo", "banner"],
  collaboratorSpecialties: [
    "Fotógrafo",
    "Videógrafo",
    "Redactor",
    "Diseñador Gráfico",
    "Editor de Video",
    "Social Media",
    "Sonido",
    "Iluminación",
    "Otro"
  ]
};

export const configService = {
  async getConfig(): Promise<AppConfig> {
    try {
      const docRef = doc(db, "settings", "types");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return { ...DEFAULT_CONFIG, ...data } as AppConfig;
      } else {
        // Initialize with defaults if not exists
        await setDoc(docRef, DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      return DEFAULT_CONFIG;
    }
  },

  async updateConfig(config: Partial<AppConfig>) {
    try {
      const docRef = doc(db, "settings", "types");
      await updateDoc(docRef, config);
    } catch (error) {
      console.error("Error updating config:", error);
      // If document doesn't exist, create it
      const docRef = doc(db, "settings", "types");
      await setDoc(docRef, { ...DEFAULT_CONFIG, ...config });
    }
  }
};
