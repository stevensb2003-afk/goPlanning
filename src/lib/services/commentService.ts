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

    // 1. Gather all potential recipients and prioritize mention > comment
    const task = await projectService.getTaskById(comment.taskId);
    const notificationMap = new Map<string, { type: 'comment' | 'mention', title: string, message: string }>();

    if (task) {
      // Add owner and assigned as 'comment' priority
      if (task.createdBy && task.createdBy !== comment.userId) {
        notificationMap.set(task.createdBy, {
          type: 'comment',
          title: 'Nuevo comentario',
          message: `${comment.userName} comentó en "${task.title}"`
        });
      }
      if (task.assignedTo) {
        task.assignedTo.forEach(uid => {
          if (uid !== comment.userId) {
            notificationMap.set(uid, {
              type: 'comment',
              title: 'Nuevo comentario',
              message: `${comment.userName} comentó en "${task.title}"`
            });
          }
        });
      }
    }

    // Add mentions as 'mention' priority (overwrites 'comment' if present)
    if (comment.mentions && comment.mentions.length > 0) {
      comment.mentions.forEach(uid => {
        if (uid !== comment.userId) {
          notificationMap.set(uid, {
            type: 'mention',
            title: 'Te mencionaron',
            message: `${comment.userName} te mencionó en un comentario`
          });
        }
      });
    }

    // 2. Send exactly one notification per unique recipient
    Array.from(notificationMap.entries()).forEach(async ([userId, info]) => {
      await notificationService.createNotification({
        userId,
        type: info.type,
        title: info.title,
        message: info.message,
        link: `/tasks?taskId=${comment.taskId}`,
        actorName: comment.userName,
        actorPhoto: comment.userPhoto,
        sourceId: comment.taskId,
        tag: `task_comment_${comment.taskId}` // Helps group notifications on the device
      });
    });

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
