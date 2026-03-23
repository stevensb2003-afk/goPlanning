"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { projectService, Task, Project } from '@/lib/services/projectService';
import { userService, UserProfile } from '@/lib/services/userService';
import { configService } from '@/lib/services/configService';

interface DataContextType {
  tasks: Task[];
  projects: Project[];
  team: UserProfile[];
  taskTypes: string[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { profile, isAdmin } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [team, setTeam] = useState<UserProfile[]>([]);
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // States for collaborator multi-source data
  const [projectTaskMap, setProjectTaskMap] = useState<Record<string, Task[]>>({});
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);

  const fetchDataOnce = async () => {
    if (!profile) return;
    try {
      const [fetchedTeam, config] = await Promise.all([
        userService.getAllUsers(),
        configService.getConfig()
      ]);
      setTeam(fetchedTeam);
      setTaskTypes(config.taskTypes);
    } catch (error) {
      console.error("Error fetching static data:", error);
    }
  };

  useEffect(() => {
    if (!profile) {
      setTasks([]);
      setProjects([]);
      setProjectTaskMap({});
      setAssignedTasks([]);
      setIsLoading(false);
      return;
    }

    fetchDataOnce();

    // 1. Subscribe to Projects
    const unsubscribeProjects = projectService.subscribeToProjects((fetchedProjects) => {
      setProjects(fetchedProjects);
    }, false);

    // 2. Main Task Subscription
    let unsubscribeMainTasks: () => void = () => {};

    if (isAdmin) {
      unsubscribeMainTasks = projectService.subscribeToAllTasks(setTasks);
    } else {
      // For collaborators, listen to tasks explicitly assigned to them
      unsubscribeMainTasks = projectService.subscribeToUserTasks(profile.uid, setAssignedTasks);
    }

    setIsLoading(false);

    return () => {
      unsubscribeProjects();
      unsubscribeMainTasks();
    };
  }, [profile, isAdmin]);

  // 3. Dynamic Project Tasks Subscription (for Collaborators)
  useEffect(() => {
    if (!profile || isAdmin || projects.length === 0) return;

    const currentUnsubs: (() => void)[] = [];
    
    projects.forEach(project => {
      const unsub = projectService.subscribeToProjectTasks(project.id!, (projTasks) => {
        setProjectTaskMap(prev => ({ ...prev, [project.id!]: projTasks }));
      });
      currentUnsubs.push(unsub);
    });

    return () => {
      currentUnsubs.forEach(unsub => unsub());
    };
  }, [profile, isAdmin, projects]);

  // Consolidate tasks for collaborators
  const consolidatedTasks = React.useMemo(() => {
    if (isAdmin) return tasks;

    // Start with assigned tasks
    const merged = [...assignedTasks];
    const seenIds = new Set(merged.map(t => t.id));

    // Add tasks from projects the user belongs to
    Object.values(projectTaskMap).forEach(projTasks => {
      projTasks.forEach(task => {
        if (!seenIds.has(task.id)) {
          merged.push(task);
          seenIds.add(task.id);
        }
      });
    });

    return merged;
  }, [isAdmin, tasks, assignedTasks, projectTaskMap]);

  const refreshData = async () => {
    await fetchDataOnce();
  };

  return (
    <DataContext.Provider value={{ 
      tasks: consolidatedTasks, 
      projects, 
      team, 
      taskTypes, 
      isLoading, 
      refreshData 
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
