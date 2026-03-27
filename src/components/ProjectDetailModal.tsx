import React, { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from 'react';
import { 
  X as XIcon, Calendar, CheckCircle2, Plus, Users, 
  Archive, Trash2, Loader2, ChevronRight, MessageSquare, 
  Send, UserPlus, History, ShieldCheck, Search,
  Clock, Check, Circle, XCircle, ArrowDown, Minus, ArrowUp, AlertCircle, Snowflake,
  Zap, Tag, CircleDashed, Pencil, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { projectService, Task, Project, ALLOWED_TRANSITIONS, TaskStatus } from '@/lib/services/projectService';
import { statusOptions, priorityOptions, getStatusConfig, getPriorityConfig } from '@/lib/constants';
import { userService, UserProfile } from '@/lib/services/userService';
import { commentService, Comment } from '@/lib/services/commentService';
import { formatLocalDate } from '@/lib/dateUtils';
import { configService } from '@/lib/services/configService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from './Badge';
import CustomDropdown from './CustomDropdown';
import CustomDatePicker from './CustomDatePicker';
import UserAvatar from './UserAvatar';
import InlineDropdown from './InlineDropdown';

interface ProjectDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdate: () => void;
}

// Usamos TaskStatus e ALLOWED_TRANSITIONS importados del servicio



const projectStatusOptions = [
  { value: 'active', label: 'Activo', variant: 'purple' as const },
  { value: 'completed', label: 'Finalizado', variant: 'emerald' as const },
  { value: 'canceled', label: 'Archivado', variant: 'slate' as const }
];



export default function ProjectDetailModal({ isOpen, onClose, project, onUpdate }: ProjectDetailModalProps) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  
  // -- Estado de Datos --
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [projectTeam, setProjectTeam] = useState<UserProfile[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [taskTypes, setTaskTypes] = useState<string[]>(['REEL', 'POST', 'STORY', 'DISENO', 'ESTRATEGIA', 'OTRO']);
  
  // -- UI State --
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const adjustTitleHeight = useCallback(() => {
    if (titleRef.current) {
      titleRef.current.style.height = '0px';
      const scrollHeight = titleRef.current.scrollHeight;
      titleRef.current.style.height = `${scrollHeight}px`;
    }
  }, []);

  useLayoutEffect(() => {
    if (selectedTask && titleRef.current) {
      adjustTitleHeight();
      
      const observer = new ResizeObserver(() => {
        adjustTitleHeight();
      });
      observer.observe(titleRef.current);
      
      const timer = setTimeout(adjustTitleHeight, 100);
      const timer2 = setTimeout(adjustTitleHeight, 300);
      const timer3 = setTimeout(adjustTitleHeight, 600);
      
      return () => {
        observer.disconnect();
        clearTimeout(timer);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [selectedTask?.id, selectedTask?.title, adjustTitleHeight]);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isArchivingInProgress, setIsArchivingInProgress] = useState(false);
  const [isDateRange, setIsDateRange] = useState(project.isDateRange || false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');
  const [tempTitle, setTempTitle] = useState(project.title);
  const [tempProjectDescription, setTempProjectDescription] = useState(project.description || '');

  // -- Task Form State --
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState('REEL');

  const isReadOnly = project.status === 'canceled';
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // -- Comentarios/Conversación --
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // -- Reactivation Confirmation State --
  const [showTaskReactivateConfirm, setShowTaskReactivateConfirm] = useState(false);
  const [pendingTaskToReactivate, setPendingTaskToReactivate] = useState<{id: string, status: any} | null>(null);

  const canReactivateTask = (task: Task) => {
    if (!profile) return false;
    const isAdmin = profile.baseRole === 'admin' || profile.email === 'info@v-creations.com';
    const isOwner = project.createdBy === user?.uid;
    return isAdmin || isOwner;
  };

  const handleStatusChangeInternal = async (task: Task, newStatus: any) => {
    if (task.status === 'canceled') {
      if (!canReactivateTask(task)) return;
      setPendingTaskToReactivate({ id: task.id!, status: newStatus });
      setShowTaskReactivateConfirm(true);
      return;
    }

    try {
      await handleTaskUpdate(task.id!, { status: newStatus });
      if (selectedTask?.id === task.id) {
        setSelectedTask({ ...selectedTask, status: newStatus } as Task);
      }
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const confirmTaskReactivate = async () => {
    if (!pendingTaskToReactivate) return;
    try {
      await handleTaskUpdate(pendingTaskToReactivate.id, { status: pendingTaskToReactivate.status });
      if (selectedTask?.id === pendingTaskToReactivate.id) {
        setSelectedTask({ ...selectedTask, status: pendingTaskToReactivate.status } as Task);
      }
      setShowTaskReactivateConfirm(false);
      setPendingTaskToReactivate(null);
    } catch (err) {
      console.error("Error reactivating task:", err);
    }
  };

  // Priorizar baseRole de AuthContext y manejar carga
  const isAdmin = profile?.baseRole === 'admin' || profile?.email === 'info@v-creations.com';
  const isMember = project.members?.includes(user?.uid || '') || project.createdBy === user?.uid;
  // Solo bloqueamos si estamos seguros de que NO es admin ni miembro
  const isCollaborator = !isAdmin && !isMember && profile !== null;

  // -- Efectos y Fetching --
  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      // 1. Guardar en Base de Datos
      await projectService.updateTask(taskId, updates, project.id!, user?.uid);
      
      // 2. Actualizar Lista Local (para sincronía instantánea al volver atrás)
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
      
      // 3. Notificar al componente padre
      onUpdate();
      
      // 4. Mostrar confirmación de guardado
      showToast("Cambios guardados", "success");
    } catch (error) {
      console.error("Error al actualizar tarea:", error);
      showToast("Error al guardar los cambios", "error");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      fetchUsers();
      setTempTitle(project.title);
      setTempProjectDescription(project.description || '');
      
      // Forzar re-calculo de altura tras un breve delay para que el DOM esté listo
      setTimeout(() => {
        const textareas = document.querySelectorAll('.auto-resize-textarea');
        textareas.forEach(ta => {
          const t = ta as HTMLTextAreaElement;
          t.style.height = 'auto';
          t.style.height = `${t.scrollHeight}px`;
        });
      }, 100);
    }
  }, [isOpen, project.id, project.members, selectedTask?.id]);

  useEffect(() => {
    if (selectedTask) {
      fetchComments();
      setTempDescription(selectedTask.description || '');
    }
  }, [selectedTask?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, config] = await Promise.all([
        projectService.getProjectTasks(project.id!),
        configService.getConfig()
      ]);
      setTasks(fetchedTasks);
      setProjectTypes(config.projectTypes);
      setTaskTypes(config.taskTypes || ['REEL', 'POST', 'STORY', 'DISENO', 'ESTRATEGIA', 'OTRO']);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const users = await userService.getAllUsers();
      setAllUsers(users);
      // Usamos project.members actualizado
      const team = users.filter((u: UserProfile) => project.members?.includes(u.uid));
      setProjectTeam(team);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchComments = async () => {
    if (!selectedTask?.id) return;
    const taskComments = await commentService.getTaskComments(selectedTask.id);
    setComments(taskComments);
  };

  // -- Manejadores de Proyecto --
  const handleUpdateProject = async (updates: Partial<Project>) => {
    try {
      await projectService.updateProject(project.id!, updates);
      onUpdate();
      showToast('Proyecto actualizado', 'success');
    } catch (error) {
      console.error("Error updating project:", error);
      showToast('Error al actualizar proyecto', 'error');
    }
  };

  const handleArchive = () => setShowArchiveConfirm(true);

  const confirmArchive = async () => {
    setIsArchivingInProgress(true);
    const isArchiving = project.status !== 'canceled';
    try {
      await projectService.archiveProject(project.id!, isArchiving);
      showToast(isArchiving ? 'Proyecto archivado' : 'Proyecto desarchivado', 'success');
      setShowArchiveConfirm(false);
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error archiving project:", error);
    } finally {
      setIsArchivingInProgress(false);
    }
  };

  // -- Manejadores de Tareas --
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await projectService.createTask({
        projectId: project.id!,
        title: newTaskTitle,
        type: newTaskType,
        priority: newTaskPriority,
        dueDate: newTaskDueDate,
        status: 'todo',
        description: '',
        assignedTo: [],
        createdBy: user?.uid,
        creatorName: profile?.fullName || user?.displayName || 'Sistema'
      });
      setNewTaskTitle('');
      setIsAddingTask(false);
      fetchData();
      onUpdate();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleInviteUser = async (uid: string) => {
    try {
      const updatedMembers = [...(project.members || []), uid];
      await projectService.updateProject(project.id!, { members: updatedMembers });
      
      // Actualización optimista del equipo local para feedback inmediato
      const invitedUser = allUsers.find(u => u.uid === uid);
      if (invitedUser) {
        setProjectTeam(prev => [...prev, invitedUser]);
      }
      
      setIsInviting(false);
      onUpdate();
      // Refetch completo para asegurar sincronía
      fetchUsers();
    } catch (error) {
      console.error("Error inviting user:", error);
    }
  };

  const handleRemoveUser = async (uid: string) => {
    if (!isAdmin && project.createdBy !== user?.uid) {
      showToast('No tienes permisos para eliminar miembros', 'error');
      return;
    }
    
    try {
      const updatedMembers = (project.members || []).filter(id => id !== uid);
      await projectService.updateProject(project.id!, { members: updatedMembers });
      
      // Actualización optimista
      setProjectTeam(prev => prev.filter(u => u.uid !== uid));
      
      showToast('Miembro eliminado', 'success');
      onUpdate();
      fetchUsers();
    } catch (error) {
      console.error("Error removing user:", error);
      showToast('Error al eliminar miembro', 'error');
    }
  };

  // -- Manejadores de Comentarios --
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCommentText(value);
    
    const words = value.split(/\s/);
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@')) {
      setShowMentions(true);
      setMentionSearch(lastWord.slice(1));
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (targetUser: UserProfile) => {
    const words = commentText.split(/\s/);
    words[words.length - 1] = `@${targetUser.fullName} `;
    setCommentText(words.join(' '));
    setShowMentions(false);
    if (!mentions.includes(targetUser.uid)) {
      setMentions([...mentions, targetUser.uid]);
    }
    textareaRef.current?.focus();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedTask?.id || !user) return;
    
    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      await commentService.addTaskComment({
        taskId: selectedTask.id,
        projectId: project.id!,
        userId: user.uid,
        userName: profile?.fullName || user.displayName || 'Usuario',
        userPhoto: profile?.photoURL || user.photoURL || '',
        text: commentText.trim(),
        mentions: mentions
      });
      setCommentText('');
      setMentions([]);
      fetchComments();
    } catch (error) {
      setCommentError("No se pudo enviar el comentario");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleAddComment(e as any);
    }
  };

  const formatCommentDate = (createdAt: any) => {
    if (!createdAt) return '';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    return date.toLocaleString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const renderTextWithLinks = (text: string) => {
    if (!text) return text;
    // Regex para detectar URLs comunes
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sky-400 hover:text-sky-300 underline underline-offset-4 decoration-sky-400/30 transition-colors font-medium inline-block"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const renderCommentText = (text: string) => {
    const parts = text.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} className="text-purple-400 font-bold">{part}</span>;
      }
      return part;
    });
  };

  // -- Valores Memorizados --
  const activeTasks = useMemo(() => tasks.filter(t => 
    t.status !== 'done' && t.status !== 'completed' && t.status !== 'canceled'
  ), [tasks]);
  
  const completedTasks = useMemo(() => tasks.filter(t => 
    t.status === 'done' || t.status === 'completed'
  ), [tasks]);
  
  const calculatedProgress = useMemo(() => {
    const relevantTasks = tasks.filter(t => t.status !== 'canceled');
    if (relevantTasks.length === 0) return 0;
    const completed = relevantTasks.filter(t => t.status === 'done' || t.status === 'completed').length;
    return Math.round((completed / relevantTasks.length) * 100);
  }, [tasks]);

  // Silent sync to Firestore when progress is recalculated (fixes legacy data automatically)
  useEffect(() => {
    if (project.id && !loading && tasks.length > 0) {
      if (calculatedProgress !== project.progress) {
        projectService.updateProject(project.id, { progress: calculatedProgress });
      }
    }
  }, [calculatedProgress, project.id, project.progress, loading, tasks.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-0 md:p-10">
      {/* Overlay */}
      <div className="absolute inset-0 bg-transparent pointer-events-auto" onClick={onClose} />

      {/* Main Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full md:max-w-7xl h-full md:h-[85vh] bg-[#0B101B] border-t md:border border-white/5 rounded-t-[32px] md:rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col pointer-events-auto"
      >
        {/* Header Section */}
        <div className="px-4 py-4 md:px-10 md:py-8 border-b border-white/5 flex flex-col md:flex-row md:justify-between md:items-center bg-white/[0.01] gap-4 md:gap-6">
          <div className="flex gap-4 md:gap-6 items-start flex-1">
            <div
              className={cn(
                "w-10 h-10 md:w-16 md:h-16 rounded-lg md:rounded-2xl flex-shrink-0 flex items-center justify-center text-lg md:text-2xl font-bold shadow-2xl transition-transform hover:scale-105"
              )}
              style={{ backgroundColor: `${project.color}20`, color: project.color, border: `1px solid ${project.color}30` }}
            >
              {project.title.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <textarea 
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={(e) => handleUpdateProject({ title: e.target.value.trim() })}
                disabled={isReadOnly || isCollaborator}
                rows={1}
                className="auto-resize-textarea text-xl md:text-3xl font-bold md:font-black text-white bg-transparent border-none focus:ring-0 p-0 w-full tracking-tight md:tracking-tighter resize-none overflow-hidden hover:bg-white/[0.02] rounded-lg transition-colors px-1"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <textarea
                value={tempProjectDescription}
                onChange={(e) => setTempProjectDescription(e.target.value)}
                onBlur={(e) => handleUpdateProject({ description: e.target.value.trim() })}
                disabled={isReadOnly || isCollaborator}
                placeholder="Añadir descripción del proyecto..."
                rows={1}
                className="auto-resize-textarea text-slate-400 text-sm md:text-base w-full bg-transparent border-none focus:ring-0 px-0 resize-none overflow-hidden hover:bg-white/[0.04] focus:bg-white/[0.04] transition-all leading-relaxed p-2 rounded-xl mt-1 scrollbar-none min-h-[40px]"
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-start gap-4 md:gap-6">
            <div className="flex items-center gap-2 md:gap-3">
              <InlineDropdown
                value={project.type || 'General'}
                options={projectTypes.map(t => ({ value: t, label: t, variant: 'purple' as const }))}
                onChange={(val) => handleUpdateProject({ type: val })}
                disabled={isCollaborator || isReadOnly}
                trigger={
                  <Badge variant="purple" className="text-[9px] md:text-[10px] px-2 py-0.5 md:px-3 md:py-1 font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all">
                    {project.type || 'General'}
                  </Badge>
                }
              />
              <InlineDropdown
                value={project.status || 'active'}
                options={projectStatusOptions}
                onChange={(val: any) => handleUpdateProject({ status: val })}
                disabled={isCollaborator || isReadOnly}
                trigger={
                  <Badge 
                    variant={projectStatusOptions.find(o => o.value === (project.status || 'active'))?.variant || 'purple'} 
                    className="text-[9px] md:text-[10px] px-2 py-0.5 md:px-3 md:py-1 font-black uppercase tracking-widest cursor-pointer hover:scale-105 transition-all"
                  >
                    {projectStatusOptions.find(o => o.value === (project.status || 'active'))?.label || 'Activo'}
                  </Badge>
                }
              />
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all hover:rotate-90">
              <XIcon size={20} className="md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Metadata & Progress Bar */}
        <div className="px-4 py-4 md:px-10 bg-white/[0.02] border-b border-white/5 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8 w-full md:w-auto">
            <div className="flex p-1 bg-white/[0.03] rounded-xl border border-white/5 self-start">
              <button 
                onClick={() => { !isReadOnly && setIsDateRange(false); !isReadOnly && handleUpdateProject({ isDateRange: false }); }}
                disabled={isReadOnly}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all", 
                  !isDateRange ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300",
                  isReadOnly && "opacity-50 cursor-not-allowed"
                )}
              >
                Única
              </button>
              <button 
                onClick={() => { !isReadOnly && setIsDateRange(true); !isReadOnly && handleUpdateProject({ isDateRange: true }); }}
                disabled={isReadOnly}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all", 
                  isDateRange ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300",
                  isReadOnly && "opacity-50 cursor-not-allowed"
                )}
              >
                Rango
              </button>
            </div>
            
            <div className="flex gap-6 md:gap-10">
              {!isDateRange ? (
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">FECHA</span>
                  <CustomDatePicker 
                    value={project.startDate || ''} 
                    onChange={(val) => handleUpdateProject({ startDate: val, endDate: val })}
                    disabled={isReadOnly || isCollaborator}
                    trigger={<span className={cn("text-xs font-bold text-white transition-colors", !isReadOnly && !isCollaborator && "cursor-pointer hover:text-purple-400")}>{project.startDate ? formatLocalDate(project.startDate, 'd MMM, yyyy') : 'Definir...'}</span>}
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">INICIO</span>
                    <CustomDatePicker 
                      value={project.startDate || ''} 
                      onChange={(val) => handleUpdateProject({ startDate: val })}
                      disabled={isReadOnly || isCollaborator}
                      trigger={<span className={cn("text-xs font-bold text-white transition-colors", !isReadOnly && !isCollaborator && "cursor-pointer hover:text-purple-400")}>{project.startDate ? formatLocalDate(project.startDate, 'd MMM, yyyy') : 'Definir...'}</span>}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ENTREGA</span>
                    <CustomDatePicker 
                      value={project.endDate || ''} 
                      onChange={(val) => handleUpdateProject({ endDate: val })}
                      align="right"
                      disabled={isReadOnly || isCollaborator}
                      trigger={<span className={cn("text-xs font-bold text-white transition-colors", !isReadOnly && !isCollaborator && "cursor-pointer hover:text-purple-400")}>{project.endDate ? formatLocalDate(project.endDate, 'd MMM, yyyy') : 'Definir...'}</span>}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col w-full md:w-80 gap-1.5">
            <div className="flex justify-between items-end">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">PROGRESO PROYECTO</span>
              <span className="text-sm font-black text-white">{calculatedProgress}%</span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${calculatedProgress}%` }}
                className="h-full bg-gradient-to-r from-purple-600 to-fuchsia-500 shadow-[0_0_10px_rgba(168,85,247,0.4)]"
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          <AnimatePresence mode="wait">
            {!selectedTask ? (
              /* ================== PROJECT OVERVIEW ================== */
              <motion.div 
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden scrollbar-subtle"
              >
                {/* Left: Task List */}
                <div className="md:flex-1 md:min-h-0 overflow-visible md:overflow-y-auto p-4 md:p-10 space-y-6 md:space-y-8 scrollbar-subtle scroll-smooth border-b md:border-b-0 md:border-r border-white/5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                      Tareas del Proyecto
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="bg-white/5 text-slate-500 px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-md text-[9px] md:text-[10px] font-bold border border-white/5">
                          {tasks.length}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchData();
                          }}
                          disabled={loading}
                          className="p-1 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all active:scale-95"
                          title="Refrescar tareas"
                        >
                          <History size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                      </div>
                    </h3>
                    <button
                      onClick={() => setIsAddingTask(true)}
                      disabled={isReadOnly || isCollaborator}
                      className={cn(
                        "w-full md:w-auto bg-purple-600 px-6 py-3 md:px-5 md:py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-purple-600/20 transition-all flex items-center justify-center gap-2",
                        isReadOnly || isCollaborator ? "opacity-50 cursor-not-allowed bg-slate-700 shadow-none grayscale" : "hover:bg-purple-500 text-white"
                      )}
                    >
                      <Plus size={16} className="md:w-3.5 md:h-3.5" /> NUEVA TAREA
                    </button>
                  </div>

                  {isAddingTask && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
                      <input 
                        type="text" 
                        placeholder="Título de la tarea..." 
                        className="w-full bg-slate-900 text-white border-none focus:ring-1 focus:ring-purple-500/30 rounded-xl px-4 py-3"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <CustomDropdown label="Tipo" value={newTaskType} options={taskTypes.map(t => ({ value: t, label: t }))} onChange={setNewTaskType} />
                        </div>
                        <div className="flex-1">
                          <CustomDropdown label="Prioridad" value={newTaskPriority} options={priorityOptions} onChange={(val: any) => setNewTaskPriority(val)} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setIsAddingTask(false)} className="text-xs font-bold text-slate-500 uppercase px-4">Cancelar</button>
                        <button onClick={handleAddTask} className="bg-purple-600 px-6 py-2 rounded-xl text-xs font-bold uppercase text-white shadow-lg">Crear</button>
                      </div>
                    </div>
                  )}

                  {loading && tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-10 h-10 text-purple-500 animate-spin opacity-50" />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cargando tareas...</p>
                    </div>
                  )}

                  {/* Task Groups */}
                  {['todo', 'in-progress', 'pending-approval', 'published', 'done', 'canceled'].map((status) => {
                    // Soporte para ambos formatos de estado (guion bajo y guion medio)
                    const normalizedStatus = status.replace('-', '_');
                    const getGroupStatus = (s: string) => {
                      const lower = (s || 'todo').toLowerCase();
                      if (lower === 'todo') return 'todo';
                      if (lower === 'in-progress' || lower === 'in_progress') return 'in-progress';
                      if (lower === 'pending-approval' || lower === 'review' || lower === 'pending_approval') return 'pending-approval';
                      if (lower === 'published') return 'published';
                      if (lower === 'done' || lower === 'completed' || lower === 'finalizado') return 'done';
                      if (lower === 'canceled') return 'canceled';
                      return 'todo'; // Fallback
                    };

                    const groupTasks = tasks.filter(t => getGroupStatus(t.status) === status);
                    if (groupTasks.length === 0 && status !== 'todo') return null;
                    const config = getStatusConfig(status as TaskStatus);
                    
                    return (
                      <div key={status} className="space-y-4">
                        <div className="flex items-center gap-2 pl-2">
                          <div className={cn("w-1 h-3 rounded-full", status === 'todo' ? "bg-slate-500" : "bg-purple-500")} />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{config.label}</span>
                        </div>
                        <div className="flex flex-col border border-white/5 rounded-[24px] overflow-hidden bg-white/[0.01]">
                          {groupTasks.map((task, idx) => (
                            <div 
                              key={task.id} 
                              className={cn(
                                "group flex flex-col md:flex-row items-start md:items-center p-5 hover:bg-white/[0.03] transition-all cursor-pointer gap-4 md:gap-0",
                                idx !== groupTasks.length - 1 && "border-b border-white/5"
                              )}
                              onClick={(e) => {
                                // Evitar abrir modal si se hace clic en un dropdown
                                if ((e.target as HTMLElement).closest('.inline-dropdown-container')) return;
                                setSelectedTask(task);
                              }}
                            >
                              {/* Left: Title & Type */}
                              <div className="flex-1 min-w-0 pr-4">
                                <h4 className="text-[13px] font-bold text-slate-100 group-hover:text-purple-400 transition-colors truncate">
                                  {task.title}
                                </h4>
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5 opacity-60">
                                  {task.type || 'REEL'}
                                </div>
                              </div>

                              {/* Right: Tokens */}
                              <div className="flex flex-wrap items-center gap-2 md:gap-4 inline-dropdown-container">
                                {/* Priority Token */}
                                  <InlineDropdown
                                    value={task.priority || 'medium'}
                                    options={priorityOptions}
                                    disabled={isReadOnly}
                                    trigger={
                                      <Badge 
                                        variant={getPriorityConfig(task.priority || 'medium').variant} 
                                        className={cn(
                                          "text-[9px] h-7 px-3 rounded-lg flex items-center gap-1.5 transition-all",
                                          isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:brightness-110 active:scale-95"
                                        )}
                                      >
                                        {getPriorityConfig(task.priority || 'medium').icon}
                                        {getPriorityConfig(task.priority || 'medium').label}
                                      </Badge>
                                    }
                                  onChange={async (val) => {
                                    try {
                                      await projectService.updateTask(task.id!, { priority: val as any });
                                      onUpdate();
                                      setTimeout(fetchData, 100);
                                    } catch (err) {
                                      console.error("Error updating priority:", err);
                                    }
                                  }}
                                  className="inline-block"
                                />

                                {/* Status Token */}
                                  <InlineDropdown
                                    value={task.status}
                                    options={statusOptions.filter(option => 
                                      option.value === task.status || 
                                      (ALLOWED_TRANSITIONS[task.status] || []).includes(option.value as any)
                                    )}
                                    disabled={isReadOnly}
                                  trigger={
                                    <Badge 
                                      variant={getStatusConfig(task.status).variant} 
                                      className={cn(
                                        "text-[9px] h-7 px-3 rounded-lg flex items-center gap-1.5 transition-all",
                                        isReadOnly ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:brightness-110 active:scale-95"
                                      )}
                                    >
                                      {getStatusConfig(task.status).icon}
                                      {getStatusConfig(task.status).label}
                                    </Badge>
                                  }
                                  onChange={(val) => handleStatusChangeInternal(task, val as any)}
                                  className="inline-block"
                                />

                                {/* Date Token */}
                                <div className="z-10">
                                  <CustomDatePicker
                                    value={task.dueDate || ""}
                                    onChange={async (val) => {
                                      try {
                                        await projectService.updateTask(task.id!, { dueDate: val }, project.id!, user?.uid);
                                        onUpdate();
                                        setTimeout(fetchData, 100);
                                      } catch (err) {
                                        console.error("Error updating date:", err);
                                      }
                                    }}
                                    align="right"
                                    disabled={isReadOnly || (!isAdmin && project.createdBy !== user?.uid)}
                                    trigger={
                                      <div className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all",
                                        !task.dueDate ? "text-slate-500 bg-slate-800/20 border border-dashed border-white/5" 
                                        : "text-slate-400 bg-slate-800/40 border border-white/5",
                                        isReadOnly ? "opacity-50 cursor-not-allowed" : (task.dueDate ? "hover:bg-slate-800 hover:text-white cursor-pointer" : "")
                                      )}>
                                        <Clock size={10} />
                                        {task.dueDate ? formatLocalDate(task.dueDate, 'dd MMM') : 'SIN FECHA'}
                                      </div>
                                    }
                                  />
                                </div>

                                {/* User Avatar Token */}
                                <div className="flex items-center gap-2 pl-2 border-l border-white/10 ml-2 z-10">
                                  <InlineDropdown
                                    value={task.assignedTo?.[0] || "unassigned"}
                                    withSearch={true}
                                    disabled={isReadOnly || (!isAdmin && project.createdBy !== user?.uid)}
                                    options={[
                                      { value: 'unassigned', label: 'Sin asignar', icon: <Users size={14} /> },
                                      ...projectTeam.map(u => ({
                                        value: u.uid,
                                        label: u.fullName || 'Usuario',
                                        icon: <UserAvatar src={u.photoURL} name={u.fullName || u.displayName} size="xs" className="w-4 h-4" />
                                      }))
                                    ]}
                                    onChange={async (val) => {
                                      try {
                                        const newAssigned = val === 'unassigned' ? [] : [val];
                                        await projectService.updateTask(task.id!, { assignedTo: newAssigned }, project.id!, user?.uid);
                                        onUpdate();
                                        setTimeout(fetchData, 100);
                                      } catch (err) {
                                        console.error("Error updating assignee:", err);
                                      }
                                    }}
                                    trigger={
                                      <div className={cn(
                                        "w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-[9px] font-black text-purple-400 overflow-hidden transition-all",
                                        isReadOnly ? "opacity-50 cursor-not-allowed" : "hover:scale-110 cursor-pointer"
                                      )}>
                                        {task.assignedTo?.[0] ? (
                                          allUsers.find(u => u.uid === task.assignedTo?.[0])?.photoURL ? (
                                            <UserAvatar 
                                              src={allUsers.find(u => u.uid === task.assignedTo?.[0])?.photoURL} 
                                              name={allUsers.find(u => u.uid === task.assignedTo?.[0])?.fullName} 
                                              size="xs" 
                                              className="w-full h-full"
                                            />
                                          ) : (
                                            allUsers.find(u => u.uid === task.assignedTo?.[0])?.fullName?.[0] || '?'
                                          )
                                        ) : (
                                          <Users size={10} className="opacity-30" />
                                        )}
                                      </div>
                                    }
                                  />
                                </div>

                                {/* Arrow */}
                                <ChevronRight size={14} className="text-slate-700 group-hover:text-purple-500 group-hover:translate-x-1 transition-all ml-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right: Project Details / Team */}
                <div className="w-full md:w-[320px] lg:w-[400px] flex-shrink-0 bg-white/[0.01] p-6 md:p-8 space-y-10 overflow-visible md:overflow-y-auto scrollbar-subtle">
                  <div className="space-y-6">
                    <h3 className="text-[11px] font-black text-slate-500 flex items-center gap-2 uppercase tracking-widest">
                      <Users size={16} /> EQUIPO
                    </h3>
                    <div className="space-y-4">
                      {projectTeam.map(u => (
                        <div key={u.uid} className="flex items-center gap-3 p-2 hover:bg-white/[0.03] rounded-xl group transition-all">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                                          <UserAvatar src={u.photoURL} name={u.fullName} size="sm" className="w-full h-full" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-200 truncate">{u.fullName}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{u.role || 'Miembro'}</p>
                          </div>
                          {(isAdmin || project.createdBy === user?.uid) && u.uid !== user?.uid && !isReadOnly && (
                            <button 
                              onClick={() => handleRemoveUser(u.uid)}
                              className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                              title="Quitar del proyecto"
                            >
                              <XIcon size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      {isInviting && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 relative">
                          <div className="relative z-20">
                            <input 
                              type="text" 
                              autoFocus
                              placeholder="Buscar por nombre..." 
                              className="w-full bg-slate-900 border border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-purple-500/20 transition-all font-medium shadow-2xl shadow-purple-500/10"
                              value={inviteSearch}
                              onChange={(e) => setInviteSearch(e.target.value)}
                            />
                            <button 
                              onClick={() => { setIsInviting(false); setInviteSearch(''); }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                              <XIcon size={14} />
                            </button>
                          </div>
                          
                          {/* Floating Popover Results */}
                          <AnimatePresence>
                            {inviteSearch.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#0f172a] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-xl"
                              >
                                <div className="max-h-[240px] overflow-y-auto scrollbar-subtle p-2 space-y-1">
                                  {allUsers
                                    .filter(u => 
                                      !project.members?.includes(u.uid) && 
                                      u.fullName?.toLowerCase().includes(inviteSearch.toLowerCase())
                                    )
                                    .slice(0, 6)
                                    .map(u => (
                                      <button 
                                        key={u.uid}
                                        onClick={() => {
                                          handleInviteUser(u.uid);
                                          setInviteSearch('');
                                          setIsInviting(false);
                                        }}
                                        className="w-full flex items-center gap-3 p-2.5 hover:bg-purple-500/10 rounded-xl transition-all group border border-transparent hover:border-purple-500/20"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400 overflow-hidden ring-1 ring-white/5">
                                          <UserAvatar src={u.photoURL} name={u.fullName} size="sm" className="w-full h-full" />
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                          <p className="text-[11px] font-bold text-slate-200 truncate group-hover:text-white">{u.fullName}</p>
                                          <p className="text-[9px] text-slate-500 truncate uppercase tracking-widest font-medium">{u.role || 'Usuario'}</p>
                                        </div>
                                        <Plus size={12} className="text-slate-600 group-hover:text-purple-400" />
                                      </button>
                                    ))
                                  }
                                  {allUsers.filter(u => !project.members?.includes(u.uid) && u.fullName?.toLowerCase().includes(inviteSearch.toLowerCase())).length === 0 && (
                                    <div className="py-8 text-center">
                                      <Search size={20} className="mx-auto text-slate-700 mb-2 opacity-20" />
                                      <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Sin resultados</p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}

                      {!isInviting && (
                        <button 
                          onClick={() => setIsInviting(true)}
                          disabled={isReadOnly || isCollaborator}
                          className="w-full border border-dashed border-white/10 rounded-xl py-3 text-[10px] font-black text-slate-500 hover:text-purple-400 hover:border-purple-400/30 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed group"
                        >
                          <Plus size={14} className="group-hover:scale-110 transition-transform" /> INCLUIR MIEMBROS
                        </button>
                      )}
                    </div>
                  </div>

                  <div className={cn(
                    "rounded-3xl p-6 space-y-4 border transition-colors",
                    isReadOnly 
                      ? "bg-emerald-500/5 border-emerald-500/10" 
                      : "bg-rose-500/5 border-rose-500/10"
                  )}>
                    <h4 className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      isReadOnly ? "text-emerald-500/60" : "text-rose-500/60"
                    )}>
                      {isReadOnly ? 'Gestión de Proyecto' : 'Zona de Peligro'}
                    </h4>
                    <button 
                      onClick={handleArchive}
                      className={cn(
                        "w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-2",
                        isReadOnly
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20"
                          : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20"
                      )}
                    >
                      {isReadOnly ? <RotateCcw size={14} /> : <Archive size={14} />} 
                      {isReadOnly ? 'Reactivar Proyecto' : 'Archivar Proyecto'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ================== TASK DETAIL ================== */
              <motion.div 
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onAnimationComplete={adjustTitleHeight}
                className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden scrollbar-subtle"
              >
                {/* Left: Task Info */}
                <div className="md:flex-1 overflow-visible md:overflow-y-auto p-4 md:p-10 space-y-8 md:space-y-10 scrollbar-subtle scroll-smooth border-b md:border-b-0 md:border-r border-white/5">
                  <button 
                    onClick={() => setSelectedTask(null)}
                    className="group flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all"
                  >
                    <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-purple-500/30 transition-all">
                      <ChevronRight size={14} className="rotate-180" />
                    </div>
                    <span>VOLVER AL PROYECTO</span>
                  </button>

                  {/* Header Section */}
                  <div className="flex flex-col gap-4 mb-8">
                    {isReadOnly && (
                      <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-4 flex items-center gap-3 text-slate-400">
                        <Archive size={18} className="text-slate-500" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Proyecto Archivado</span>
                          <span className="text-sm">Este proyecto está en modo solo lectura. No se permiten ediciones ni nuevos comentarios.</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 space-y-2">
                        
                        <div className="group relative">
                          <textarea
                            ref={titleRef}
                            value={selectedTask.title}
                            onChange={(e) => {
                              setSelectedTask({ ...selectedTask, title: e.target.value } as Task);
                            }}
                            onInput={adjustTitleHeight}
                            onFocus={adjustTitleHeight}
                            onBlur={(e) => handleTaskUpdate(selectedTask.id!, { title: e.target.value })}
                            disabled={isReadOnly}
                            className={cn(
                              "w-full bg-transparent text-xl md:text-3xl font-bold text-white bg-transparent border-none focus:ring-0 p-0 w-full tracking-tight md:tracking-tighter resize-none overflow-y-hidden whitespace-pre-wrap break-words leading-tight auto-resize-textarea",
                              isReadOnly ? "cursor-default" : "hover:bg-white/[0.02] cursor-text focus:bg-white/[0.02]"
                            )}
                            rows={1}
                          />
                          {!isReadOnly && (
                            <div className="absolute -right-8 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Pencil size={18} className="text-slate-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <InlineDropdown
                      value={selectedTask.type || 'REEL'}
                      options={taskTypes.map(t => ({ value: t, label: t, icon: <div className="w-1.5 h-1.5 rounded-full bg-purple-400" /> }))}
                      onChange={(val) => {
                        const updatedTask = { ...selectedTask, type: val };
                        setSelectedTask(updatedTask as Task);
                        handleTaskUpdate(selectedTask.id!, { type: val });
                      }}
                      disabled={!isAdmin && project.createdBy !== user?.uid || isReadOnly}
                      trigger={
                        <Badge variant="purple" className="text-[10px] px-4 py-1.5 font-bold uppercase tracking-widest cursor-pointer hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5">
                          <Tag size={10} className="opacity-70" />
                          {selectedTask.type || 'REEL'}
                        </Badge>
                      }
                    />
                    <InlineDropdown
                      value={selectedTask.status}
                      options={statusOptions.filter(option => 
                        option.value === selectedTask.status || 
                        (ALLOWED_TRANSITIONS[selectedTask.status] || []).includes(option.value as any)
                      )}
                      trigger={
                        <Badge variant={getStatusConfig(selectedTask.status).variant} className="text-[10px] px-4 py-1.5 font-bold uppercase tracking-widest cursor-pointer hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5">
                          <CircleDashed size={10} className="opacity-70" />
                          {getStatusConfig(selectedTask.status).label}
                        </Badge>
                      }
                      onChange={(val) => handleStatusChangeInternal(selectedTask, val as any)}
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
                    {/* ENCARGADO */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 space-y-2.5 shadow-inner relative overflow-hidden group">
                      <div className="absolute top-2 right-2 opacity-5 scale-150 text-purple-500"><Users /></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        ENCARGADO
                        <Pencil size={8} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                      </span>
                      <div className="min-h-[32px] flex items-center gap-3">
                        <InlineDropdown
                          value={selectedTask.assignedTo?.[0] || "unassigned"}
                          withSearch={true}
                          disabled={!isAdmin && project.createdBy !== user?.uid || isReadOnly}
                          options={[
                            { value: 'unassigned', label: 'Sin asignar', icon: <Users size={14} /> },
                            ...projectTeam.map(u => ({
                              value: u.uid,
                              label: u.fullName || 'Usuario',
                              icon: <UserAvatar src={u.photoURL} name={u.fullName || u.displayName} size="xs" className="w-4 h-4" />
                            }))
                          ]}
                          onChange={(val) => {
                            const newAssigned = val === 'unassigned' ? [] : [val];
                            const updatedTask = { ...selectedTask, assignedTo: newAssigned };
                            setSelectedTask(updatedTask as Task);
                            handleTaskUpdate(selectedTask.id!, { assignedTo: newAssigned });
                          }}
                          trigger={
                            <div className="flex items-center gap-2 cursor-pointer group/trigger">
                              {selectedTask.assignedTo?.[0] ? (
                                <>
                                  <UserAvatar 
                                    src={projectTeam.find(u => u.uid === selectedTask.assignedTo?.[0])?.photoURL || undefined} 
                                    name={projectTeam.find(u => u.uid === selectedTask.assignedTo?.[0])?.fullName || 'U'} 
                                    size="sm" 
                                    className="w-6 h-6 rounded-full object-cover border border-white/10" 
                                  />
                                  <p className="text-sm font-bold text-white leading-tight group-hover/trigger:text-purple-400 transition-colors">
                                    {projectTeam.find(u => u.uid === selectedTask.assignedTo?.[0])?.fullName || 'No asignado'}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm font-bold text-slate-400 group-hover/trigger:text-purple-400 transition-colors">No asignado</p>
                              )}
                            </div>
                          }
                        />
                      </div>
                    </div>

                    {/* FECHA ENTREGA */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 space-y-2.5 shadow-inner relative overflow-hidden group">
                      <div className="absolute top-2 right-2 opacity-5 scale-150 text-purple-500"><Calendar /></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        FECHA ENTREGA
                        <Pencil size={8} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                      </span>
                      <div className="min-h-[32px] flex items-center">
                        <CustomDatePicker
                          value={selectedTask.dueDate || ""}
                          onChange={(val) => {
                            const updatedTask = { ...selectedTask, dueDate: val };
                            setSelectedTask(updatedTask as Task);
                            handleTaskUpdate(selectedTask.id!, { dueDate: val });
                          }}
                          align="left"
                          disabled={!isAdmin && project.createdBy !== user?.uid || isReadOnly}
                          trigger={
                            <p className="text-sm font-bold text-white leading-tight cursor-pointer hover:text-purple-400 transition-colors">
                              {selectedTask.dueDate || 'No definida'}
                            </p>
                          }
                        />
                      </div>
                    </div>

                    {/* CREADOR (Read Only) */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 space-y-2.5 shadow-inner relative overflow-hidden group">
                      <div className="absolute top-2 right-2 opacity-5 scale-150 text-purple-500"><UserPlus /></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">CREADOR</span>
                      <div className="min-h-[32px] flex items-center gap-2">
                        {selectedTask.createdBy ? (
                          <>
                            <UserAvatar 
                              src={allUsers.find(u => u.uid === selectedTask.createdBy)?.photoURL || undefined} 
                              name={allUsers.find(u => u.uid === selectedTask.createdBy)?.fullName || 'S'} 
                              size="sm" 
                              className="w-6 h-6 rounded-full object-cover border border-white/10" 
                            />
                            <p className="text-sm font-bold text-white leading-tight">
                              {allUsers.find(u => u.uid === selectedTask.createdBy)?.fullName || 'Sistema'}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-white leading-tight">Sistema</p>
                        )}
                      </div>
                    </div>

                    {/* FECHA CREADO (Read Only) */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-4 space-y-2.5 shadow-inner relative overflow-hidden group">
                      <div className="absolute top-2 right-2 opacity-5 scale-150 text-emerald-500"><History /></div>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">FECHA CREADO</span>
                      <p className="text-sm font-bold text-white leading-tight min-h-[32px] flex items-center">
                        {selectedTask.createdAt ? (typeof selectedTask.createdAt === 'string' ? selectedTask.createdAt : (selectedTask.createdAt.toDate?.().toLocaleDateString() || '--')) : '--'}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <History size={16} /> DESCRIPCIÓN
                    </h4>
                    <div 
                      onClick={() => !isReadOnly && setIsEditingDescription(true)}
                      className={cn(
                        "bg-white/[0.01] border border-white/5 rounded-[24px] md:rounded-[32px] p-4 md:p-8 min-h-[120px] md:min-h-[150px] transition-all group relative",
                        !isReadOnly ? "cursor-pointer hover:bg-white/[0.03]" : "cursor-default"
                      )}
                    >
                      {isEditingDescription ? (
                        <textarea 
                          className="w-full bg-transparent border-none focus:ring-0 text-slate-300 min-h-[200px] resize-none outline-none p-0 m-0"
                          value={tempDescription}
                          onChange={(e) => setTempDescription(e.target.value)}
                          onBlur={() => { 
                            setIsEditingDescription(false); 
                            handleTaskUpdate(selectedTask.id!, { description: tempDescription });
                            setSelectedTask({ ...selectedTask, description: tempDescription } as Task);
                          }}
                          autoFocus
                          placeholder="Escribe una descripción..."
                          disabled={isReadOnly}
                        />
                      ) : (
                        <div className="text-slate-400 leading-relaxed whitespace-pre-wrap">
                          {selectedTask.description ? renderTextWithLinks(selectedTask.description) : 'Haz clic para añadir una descripción...'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Conversation */}
                <div className="w-full md:w-[320px] lg:w-[450px] flex-shrink-0 flex flex-col overflow-visible bg-white/[0.01]">
                  <div className="p-8 border-b border-white/5 bg-[#0B101B]/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center font-bold text-white overflow-hidden">
                        <UserAvatar src={user?.photoURL} name={profile?.fullName || user?.displayName} size="xs" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="relative">
                          <textarea 
                            placeholder="Escribe un mensaje..."
                            value={commentText}
                            onChange={handleCommentChange}
                            onKeyDown={handleCommentKeyDown}
                            ref={textareaRef}
                            className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-purple-500/30 min-h-[50px] max-h-[150px] resize-none scrollbar-none transition-all"
                            disabled={isReadOnly}
                          />
                          
                          {/* Mentions List */}
                          <AnimatePresence>
                            {showMentions && (
                              <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 mt-2"
                              >
                                <div className="p-2 max-h-48 overflow-y-auto">
                                  {projectTeam
                                    .filter(u => u.fullName?.toLowerCase().includes(mentionSearch.toLowerCase()))
                                    .map(u => (
                                      <button
                                        key={u.uid}
                                        onClick={() => insertMention(u)}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors text-left"
                                      >
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex-shrink-0 flex items-center justify-center font-bold text-white overflow-hidden text-xs">
                                          <UserAvatar src={u.photoURL} name={u.fullName || u.displayName} size="sm" className="w-full h-full" />
                                        </div>
                                        <div>
                                          <p className="text-xs font-bold text-white">{u.fullName}</p>
                                          <p className="text-[10px] text-slate-500">@{u.fullName?.split(' ')[0].toLowerCase() || 'usuario'}</p>
                                        </div>
                                      </button>
                                    ))}
                                  {projectTeam.filter(u => u.fullName?.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                                    <p className="p-3 text-center text-xs text-slate-500">No se encontraron miembros</p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="flex justify-end">
                          <button 
                            onClick={handleAddComment}
                            disabled={!commentText.trim() || isSubmittingComment || isReadOnly}
                            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 rounded-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-purple-500 disabled:opacity-50 disabled:bg-slate-800 transition-all shadow-lg shadow-purple-600/20 group"
                          >
                            <span>{isSubmittingComment ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}</span>
                            <Send size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-visible md:overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 scrollbar-subtle">
                    {comments.map(c => (
                      <div key={c.id} className="flex gap-4 animate-in slide-in-from-right-2 duration-300">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center font-bold text-white overflow-hidden">
                          <UserAvatar src={c.userPhoto} name={c.userName} size="sm" className="w-full h-full" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">{c.userName}</span>
                            </div>
                            <span className="text-[10px] font-medium text-slate-500 mt-0.5">{formatCommentDate(c.createdAt)}</span>
                          </div>
                          <div className="bg-white/[0.03] border border-white/5 rounded-2xl md:rounded-3xl rounded-tl-none p-3 md:p-5 text-sm text-slate-300 shadow-inner leading-relaxed overflow-hidden break-words">
                            {renderCommentText(c.text)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Custom Confirmation Modal */}
        <AnimatePresence>
          {showArchiveConfirm && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={() => setShowArchiveConfirm(false)} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-2xl space-y-6 md:space-y-8 text-center"
              >
                <div className={cn(
                  "w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl border flex items-center justify-center mx-auto transition-colors",
                  isReadOnly 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                    : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                )}>
                  {isReadOnly ? <RotateCcw size={32} className="md:w-10 md:h-10" /> : <Archive size={32} className="md:w-10 md:h-10" />}
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {isReadOnly ? '¿Reactivar proyecto?' : '¿Archivar proyecto?'}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed px-4">
                    {isReadOnly 
                      ? 'El proyecto volverá a estar activo y podrás editar tareas, añadir miembros y enviar comentarios.'
                      : 'Al archivar este proyecto, se ocultará de la vista principal y pasará a modo solo lectura.'}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setShowArchiveConfirm(false)} className="flex-1 py-4 text-xs font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest">CANCELAR</button>
                  <button 
                    onClick={confirmArchive} 
                    className={cn(
                      "flex-1 py-4 rounded-2xl text-xs font-black text-white shadow-lg transition-all uppercase tracking-widest",
                      isReadOnly
                        ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                        : "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                    )}
                  >
                    {isArchivingInProgress 
                      ? 'PROCESANDO...' 
                      : (isReadOnly ? 'SÍ, ACTIVAR' : 'SÍ, ARCHIVAR')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Task Reactivation Confirmation Modal */}
        {showTaskReactivateConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto">
            <div className="bg-[#0B101B] border border-white/10 rounded-[32px] p-8 max-w-sm w-full shadow-2xl space-y-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <RotateCcw size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight uppercase">¿Reactivar Tarea?</h3>
                <p className="text-sm text-slate-400 leading-relaxed px-4">
                  Esta tarea está cancelada. ¿Confirmas que deseas volver a activarla para que el equipo continúe trabajando?
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setShowTaskReactivateConfirm(false);
                    setPendingTaskToReactivate(null);
                  }}
                  className="flex-1 py-4 text-xs font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={confirmTaskReactivate}
                  className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-lg shadow-emerald-600/20 transition-all uppercase tracking-widest"
                >
                  SÍ, ACTIVAR
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
