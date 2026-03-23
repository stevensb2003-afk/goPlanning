import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../src/lib/firebase";

async function cleanup() {
  console.log("Starting cleanup of untitled projects...");
  const querySnapshot = await getDocs(collection(db, "projects"));
  let deletedCount = 0;
  
  for (const projectDoc of querySnapshot.docs) {
    if (!projectDoc.data().title) {
      await deleteDoc(doc(db, "projects", projectDoc.id));
      console.log(`Deleted project: ${projectDoc.id}`);
      deletedCount++;
    }
  }
  
  console.log(`Cleanup finished. Deleted ${deletedCount} projects.`);
}

cleanup().catch(console.error);
