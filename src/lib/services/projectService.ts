import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notificationService } from "./notificationService";
import { userService } from "./userService";

export interface Project {
  id?: string;
  title: string;
  category: string;
  description: string;
  progress: number;
  members: string[]; // array of user UIDs
  color: string;
  type?: string;
  status?: 'active' | 'completed' | 'canceled';
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  startDate?: string;
  endDate?: string;
  isDateRange?: boolean;
}

export type TaskStatus = 'todo' | 'in-progress' | 'pending-approval' | 'published' | 'frozen' | 'done' | 'canceled' | 'in_progress' | 'review' | 'completed';

export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  'todo': ['in-progress', 'frozen', 'canceled'],
  'in-progress': ['todo', 'pending-approval', 'frozen', 'canceled'],
  'pending-approval': ['in-progress', 'published'], 
  'published': ['done', 'canceled'],
  'frozen': ['todo', 'in-progress', 'canceled'],
  'done': ['in-progress'],
  'canceled': ['todo'],
  // Legacy mappings
  'in_progress': ['todo', 'pending-approval', 'frozen', 'canceled'],
  'review': ['in-progress', 'published'],
  'completed': ['in-progress']
};

export interface Task {
  id?: string;
  projectId?: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: string[]; // array of user UIDs
  type?: string;
  dueDate: string;
  createdBy?: string;
  createdAt: any;
  updatedAt?: any;
  approvedBy?: string;
  approvedAt?: any;
  completedAt?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  creatorName?: string;
  creatorPhoto?: string;
  link?: string;
}

export const projectService = {
  // Real-time subscriptions
  subscribeToProjects(callback: (projects: Project[]) => void, includeArchived: boolean = false) {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      let projects = snapshot.docs
        .filter(doc => doc.data().title)
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Project[];
      
      if (!includeArchived) {
        projects = projects.filter(p => p.status !== 'canceled');
      }
      callback(projects);
    }, (error) => {
      console.error("Error in projects subscription:", error);
    });
  },

  subscribeToAllTasks(callback: (tasks: Task[]) => void) {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snapshot) => {
      const allTasks = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        title: doc.data().title || "Tarea sin título",
        status: doc.data().status || "todo",
      })) as Task[];
      callback(allTasks);
    }, (error) => {
      console.error("Error in all tasks subscription:", error);
    });
  },

  subscribeToProjectTasks(projectId: string, callback: (tasks: Task[]) => void) {
    const q = query(
      collection(db, "tasks"), 
      where("projectId", "==", projectId),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        title: doc.data().title || "Tarea sin título",
        status: doc.data().status || "todo",
      })) as Task[];
      callback(tasks);
    }, (error) => {
      console.error(`Error in project tasks subscription (${projectId}):`, error);
    });
  },

  subscribeToUserTasks(userId: string, callback: (tasks: Task[]) => void) {
    const q = query(
      collection(db, "tasks"),
      where("assignedTo", "array-contains", userId)
    );
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        title: doc.data().title || "Tarea sin título",
        status: doc.data().status || "todo",
      })) as Task[];
      
      const sortedTasks = tasks.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeA - timeB;
      });
      callback(sortedTasks);
    }, (error) => {
      console.error("Error in user tasks subscription:", error);
    });
  },

  // Projects
  async getProjects(includeArchived: boolean = false) {
    try {
      const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      let projects = querySnapshot.docs
        .filter(doc => doc.data().title) // Filter out documents without a title
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            category: data.category || "General",
            description: data.description || "",
            progress: data.progress || 0,
            members: data.members || [],
            color: data.color || "#A855F7",
            type: data.type || "General",
            status: data.status || "active",
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            createdBy: data.createdBy || "",
            startDate: data.startDate || "",
            endDate: data.endDate || "",
            isDateRange: data.isDateRange ?? false,
          };
        }) as Project[];
        
      if (!includeArchived) {
        projects = projects.filter(p => p.status !== 'canceled');
      }
      return projects;
    } catch (error) {
      console.error("Error fetching projects:", error);
      return [];
    }
  },

  async getProject(projectId: string): Promise<Project | null> {
    try {
      const docRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data
        } as Project;
      }
      return null;
    } catch (error) {
      console.error("Error fetching project:", error);
      return null;
    }
  },



  async deleteProject(id: string) {
    const docRef = doc(db, "projects", id);
    await deleteDoc(docRef);
  },

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, "projects"), {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateProject(id: string, data: Partial<Project>) {
    const docRef = doc(db, "projects", id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  async archiveProject(id: string, isArchived: boolean = true) {
    return this.updateProject(id, { status: isArchived ? 'canceled' : 'active' });
  },

  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const docRef = doc(db, "tasks", taskId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Task;
      }
      return null;
    } catch (error) {
      console.error("Error fetching task by ID:", error);
      return null;
    }
  },

  // Tasks
  async getProjectTasks(projectId: string) {
    try {
      const q = query(
        collection(db, "tasks"), 
        where("projectId", "==", projectId),
        orderBy("createdAt", "asc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          title: data.title || "Tarea sin título",
          status: data.status || "todo",
        };
      }) as Task[];
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return [];
    }
  },

  async getAllTasks() {
    try {
      // Get only active/completed projects to filter tasks
      const activeProjects = await this.getProjects(false);
      const activeProjectIds = new Set(activeProjects.map(p => p.id));

      const q = query(
        collection(db, "tasks"),
        orderBy("createdAt", "asc")
      );
      const querySnapshot = await getDocs(q);
      const allTasks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          title: data.title || "Tarea sin título",
          status: data.status || "todo",
        };
      }) as Task[];

      // Only return tasks from non-canceled projects OR tasks without a project
      return allTasks.filter(task => !task.projectId || activeProjectIds.has(task.projectId));
    } catch (error) {
      console.error("Error fetching all tasks:", error);
      return [];
    }
  },

  async getUserTasks(userId: string) {
    try {
      // Get only active/completed projects to filter tasks
      const activeProjects = await this.getProjects(false);
      const activeProjectIds = new Set(activeProjects.map(p => p.id));

      const q = query(
        collection(db, "tasks"),
        where("assignedTo", "array-contains", userId)
      );
      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          title: data.title || "Tarea sin título",
          status: data.status || "todo",
        };
      }) as Task[];
      
      // Filter tasks from non-canceled projects and sort
      return tasks
        .filter(task => !task.projectId || activeProjectIds.has(task.projectId))
        .sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeA - timeB; // ascending
        });
    } catch (error) {
      console.error("Error fetching user tasks:", error);
      return [];
    }
  },

  async updateProjectProgress(projectId?: string) {
    if (!projectId) return 0;
    try {
      const q = query(collection(db, "tasks"), where("projectId", "==", projectId));
      const querySnapshot = await getDocs(q);
      const tasks = querySnapshot.docs.map(doc => doc.data()) as Task[];
      
      let progress = 0;
      if (tasks.length > 0) {
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        progress = Math.round((completedTasks / tasks.length) * 100);
      }

      // Fetch current project to check its status
      const projectDoc = await getDoc(doc(db, "projects", projectId));
      if (!projectDoc.exists()) return 0;
      
      const projectData = projectDoc.data() as Project;
      const updates: Partial<Project> = { progress };

      // Automatic status management
      if (progress === 100 && projectData.status === 'active') {
        updates.status = 'completed';
      } else if (progress < 100 && projectData.status === 'completed') {
        updates.status = 'active';
      }
      
      await this.updateProject(projectId, updates);
      return progress;
    } catch (error) {
      console.error("Error updating project progress:", error);
      return 0;
    }
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt'>) {
    const docRef = await addDoc(collection(db, "tasks"), {
      ...task,
      createdAt: serverTimestamp(),
      ...(task.status === 'done' ? { completedAt: serverTimestamp() } : {}),
    });
    
    // 1. Notify Assignees
    if (task.assignedTo && task.assignedTo.length > 0) {
      const creator = task.createdBy ? await userService.getProfile(task.createdBy) : null;
      for (const userId of task.assignedTo) {
        if (userId === task.createdBy) continue; // skip self-assignment notification
        await notificationService.createNotification({
          userId,
          type: 'assignment',
          title: 'Nueva tarea asignada',
          message: `Te han asignado la tarea: "${task.title}"`,
          link: `/tasks?taskId=${docRef.id}`,
          actorName: creator?.fullName || creator?.displayName || 'Un administrador',
          actorPhoto: creator?.photoURL || undefined,
          sourceId: docRef.id
        });
      }
    }

    // Update project progress
    if (task.projectId) {
      await this.updateProjectProgress(task.projectId);
    }
    return docRef.id;
  },

  async updateTask(id: string, data: Partial<Task>, projectId?: string, actorId?: string) {
    // Fetch original task for comparison
    const oldTask = await this.getTaskById(id);
    if (!oldTask) return;

    const docRef = doc(db, "tasks", id);
    const finalData = { ...data, updatedAt: serverTimestamp() };
    
    if (data.status === 'done') {
      (finalData as any).completedAt = serverTimestamp();
    } else if (data.status) {
      (finalData as any).completedAt = null;
    }

    await updateDoc(docRef, finalData);

    // --- NOTIFICATIONS ---
    const actor = actorId ? await userService.getProfile(actorId) : null;
    const actorName = actor?.displayName || 'Un miembro del equipo';
    const actorPhoto = actor?.photoURL || undefined;

    // 1. Notify new assignees
    if (data.assignedTo) {
      const oldAssignees = new Set(oldTask.assignedTo || []);
      const newAssignees = data.assignedTo.filter(uid => !oldAssignees.has(uid));
      
      for (const userId of newAssignees) {
        if (userId === actorId) continue;
        await notificationService.createNotification({
          userId,
          type: 'assignment',
          title: 'Nueva tarea asignada',
          message: `Te han asignado la tarea: "${oldTask.title}"`,
          link: `/tasks?taskId=${id}`,
          actorName,
          actorPhoto,
          sourceId: id
        });
      }
    }

    // 2. Status changes
    if (data.status && data.status !== oldTask.status) {
      // IF Pending Approval -> Notify Admins
      if (data.status === 'pending-approval') {
        const admins = await userService.getAdmins();
        for (const admin of admins) {
          if (admin.uid === actorId) continue;
          await notificationService.createNotification({
            userId: admin.uid,
            type: 'pending-approval',
            title: 'Tarea pendiente de aprobación',
            message: `${actorName} ha solicitado aprobación para: "${oldTask.title}"`,
            link: `/tasks?taskId=${id}`,
            actorName,
            actorPhoto,
            sourceId: id
          });
        }
      }
      // IF Published or Todo (Returned from pending) -> Notify Assignees
      else if ((data.status === 'published' || data.status === 'todo') && oldTask.status === 'pending-approval') {
        const recipients = new Set(oldTask.assignedTo || []);
        for (const userId of Array.from(recipients)) {
          if (userId === actorId) continue;
          await notificationService.createNotification({
            userId,
            type: 'approval',
            title: data.status === 'published' ? 'Tarea aprobada' : 'Tarea devuelta',
            message: `La tarea "${oldTask.title}" ha sido ${data.status === 'published' ? 'aprobada' : 'devuelta para corrección'}.`,
            link: `/tasks?taskId=${id}`,
            actorName,
            actorPhoto,
            sourceId: id
          });
        }
      }
      // IF Done -> Notify Creator
      else if (data.status === 'done' && oldTask.createdBy) {
        if (oldTask.createdBy !== actorId) {
          await notificationService.createNotification({
            userId: oldTask.createdBy,
            type: 'approval', // Using approval category for completion
            title: 'Tarea completada',
            message: `${actorName} ha marcado como completada: "${oldTask.title}"`,
            link: `/tasks?taskId=${id}`,
            actorName,
            actorPhoto,
            sourceId: id
          });
        }
      }
    }
    
    // If we have the projectId, update project progress
    if (projectId) {
      await this.updateProjectProgress(projectId);
    } else if (data.projectId) {
      await this.updateProjectProgress(data.projectId);
    }
  },

  async deleteTask(id: string, projectId: string) {
    const docRef = doc(db, "tasks", id);
    await deleteDoc(docRef);
    await this.updateProjectProgress(projectId);
  },

  async getDashboardStats() {
    try {
      const activeProjects = await this.getProjects(false);
      const activeProjectIds = new Set(activeProjects.map(p => p.id));
      
      const q = query(collection(db, "tasks"), orderBy("dueDate", "asc"));
      const querySnapshot = await getDocs(q);
      
      const allTasks = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Task[];

      // Filter tasks: include independent tasks OR tasks from active projects
      const activeTasks = allTasks.filter(t => 
        t.status !== 'canceled' && 
        (!t.projectId || activeProjectIds.has(t.projectId))
      );
      
      const totalTasksCount = activeTasks.length;
      const completedTasksCount = activeTasks.filter(t => t.status === 'done').length;
      const pendingTasksCount = totalTasksCount - completedTasksCount;
      
      // Global Progress including ALL active tasks
      const globalProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

      // Calculate tasks by category
      const activeTasksByCategory: Record<string, number> = {};
      const completedTasksByCategory: Record<string, number> = {};
      
      activeTasks.forEach(t => {
        const cat = t.type || 'General';
        if (t.status === 'done') {
          completedTasksByCategory[cat] = (completedTasksByCategory[cat] || 0) + 1;
        } else {
          activeTasksByCategory[cat] = (activeTasksByCategory[cat] || 0) + 1;
        }
      });

      // Calculate tasks by member
      const tasksByMember: Record<string, number> = {};
      activeTasks.forEach(t => {
        if (t.assignedTo && t.assignedTo.length > 0) {
          t.assignedTo.forEach(uid => {
            tasksByMember[uid] = (tasksByMember[uid] || 0) + 1;
          });
        } else {
          tasksByMember['Unassigned'] = (tasksByMember['Unassigned'] || 0) + 1;
        }
      });

      // Tasks completed in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const completedLast7Days = activeTasks.filter(t => {
        if (t.status !== 'done') return false;
        // Use completedAt if available, fallback to updatedAt or createdAt
        const date = t.completedAt?.toDate?.() || t.updatedAt?.toDate?.() || t.createdAt?.toDate?.();
        return date && date > sevenDaysAgo;
      }).length;

      // Get upcoming deadlines
      const upcomingDeadlines = activeTasks
        .filter(t => t.status !== 'done' && t.dueDate)
        .slice(0, 5);

      // --- HISTORICAL METRICS (Using already fetched allTasks) ---
      const lifetimeTasks = allTasks.length;
      const lifetimeCompleted = allTasks.filter(d => d.status === 'done').length;
      const lifetimeProgress = lifetimeTasks > 0 ? Math.round((lifetimeCompleted / lifetimeTasks) * 100) : 0;

      return {
        activeProjectsCount: activeProjects.length,
        activeProjects: activeProjects.slice(0, 3),
        totalTasks: totalTasksCount,
        completedTasks: completedTasksCount,
        pendingTasks: pendingTasksCount,
        globalProgress,
        completedLast7Days,
        upcomingDeadlines,
        activeTasksByCategory,
        completedTasksByCategory,
        tasksByMember,
        lifetimeTasks,
        lifetimeCompleted,
        lifetimeProgress
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return null;
    }
  }
};
