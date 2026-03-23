import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notificationService } from "./notificationService";
import { projectService } from "./projectService";

export interface Comment {
  id?: string;
  taskId: string;
  projectId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  mentions?: string[]; // array of user UIDs
  createdAt: any;
}

export const commentService = {
  async addTaskComment(comment: Omit<Comment, 'id' | 'createdAt'>) {
    const commentsRef = collection(db, "comments");
    const docRef = await addDoc(commentsRef, {
      ...comment,
      createdAt: serverTimestamp()
    });

    // 1. Notify Task Owner
    const task = await projectService.getTaskById(comment.taskId);
    if (task && task.createdBy !== comment.userId) {
      const recipients = new Set<string>();
      if (task.assignedTo) task.assignedTo.forEach(uid => recipients.add(uid));
      if (task.createdBy) recipients.add(task.createdBy);

      // Don't notify the person who just commented
      recipients.delete(comment.userId);

      for (const userId of Array.from(recipients)) {
        await notificationService.createNotification({
          userId,
          type: 'comment',
          title: 'Nuevo comentario',
          message: `${comment.userName} comentó en "${task.title}"`,
          link: `/tasks?taskId=${task.id}`,
          actorName: comment.userName,
          actorPhoto: comment.userPhoto,
          sourceId: task.id
        });
      }
    }

    // 2. Notify Mentions
    if (comment.mentions && comment.mentions.length > 0) {
      for (const mentionedUid of comment.mentions) {
        if (mentionedUid === comment.userId) continue; // skip self
        
        await notificationService.createNotification({
          userId: mentionedUid,
          type: 'mention',
          title: 'Te mencionaron',
          message: `${comment.userName} te mencionó en un comentario`,
          link: `/tasks?taskId=${comment.taskId}`,
          actorName: comment.userName,
          actorPhoto: comment.userPhoto,
          sourceId: comment.taskId
        });
      }
    }

    return docRef;
  },

  async getTaskComments(taskId: string) {
    const q = query(
      collection(db, "comments"), 
      where("taskId", "==", taskId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Comment[];
  },

  async deleteComment(commentId: string) {
    return deleteDoc(doc(db, "comments", commentId));
  }
};
