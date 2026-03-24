"use client";
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, MessageSquare, Clock, User as UserIcon, CheckCircle2, UserPlus, Calendar, Check, ShieldCheck, History, ArrowDown, ArrowUp, Minus, AlertCircle, AlignLeft, Edit3 } from 'lucide-react';
import Badge from './Badge';
import { useAuth } from '@/context/AuthContext';
import { commentService } from '@/lib/services/commentService';
import { projectService, type Task, type TaskStatus, ALLOWED_TRANSITIONS } from '@/lib/services/projectService';
import InlineDropdown from './InlineDropdown';
import CustomDatePicker from './CustomDatePicker';
import { serverTimestamp } from 'firebase/firestore';
import CommentText from './CommentText';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';


interface TaskDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  team?: any[];
  taskTypes?: string[];
  onUpdate?: () => void;
  onLocalUpdate?: (taskId: string, updates: any) => void;
}

const statusOptions = [
  { value: 'todo', label: 'Pendiente', variant: 'slate' as const, icon: <div className="w-2 h-2 rounded-full bg-slate-500" /> },
  { value: 'in-progress', label: 'En Progreso', variant: 'cyan' as const, icon: <div className="w-2 h-2 rounded-full bg-cyan-500" /> },
  { value: 'pending-approval', label: 'Por Aprobar', variant: 'pink' as const, icon: <div className="w-2 h-2 rounded-full bg-pink-500" /> },
  { value: 'published', label: 'Publicar / Compartir', variant: 'indigo' as const, icon: <div className="w-2 h-2 rounded-full bg-indigo-500" /> },
  { value: 'frozen', label: 'Congelado', variant: 'amber' as const, icon: <div className="w-2 h-2 rounded-full bg-amber-500" /> },
  { value: 'done', label: 'Completado', variant: 'emerald' as const, icon: <div className="w-2 h-2 rounded-full bg-emerald-500" /> },
  { value: 'canceled', label: 'Cancelado', variant: 'rose' as const, icon: <div className="w-2 h-2 rounded-full bg-rose-500" /> },
];

export const priorityOptions = [
  { value: 'low' as const, label: 'Baja', icon: <ArrowDown size={14} />, variant: 'slate' as const },
  { value: 'medium' as const, label: 'Media', icon: <Minus size={14} />, variant: 'indigo' as const },
  { value: 'high' as const, label: 'Alta', icon: <ArrowUp size={14} />, variant: 'amber' as const },
  { value: 'urgent' as const, label: 'Urgente', icon: <AlertCircle size={14} />, variant: 'rose' as const },
];

export function getPriorityConfig(priority?: string) {
  return priorityOptions.find(opt => opt.value === priority) || priorityOptions[1];
}

export default function TaskDetailDrawer({ 
  isOpen, 
  onClose, 
  task, 
  team = [], 
  taskTypes = [], 
  onUpdate,
  onLocalUpdate
}: TaskDetailDrawerProps) {
  const { user, profile, isAdmin, isCollaborator } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState(task?.description || "");
  const [mentionSearch, setMentionSearch] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentions, setMentions] = useState<string[]>([]);
  const [projectMembers, setProjectMembers] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null);

  useEffect(() => {
    const fetchProjectMembers = async () => {
      if (task?.projectId) {
        const proj = await projectService.getProject(task.projectId);
        if (proj) setProjectMembers(proj.members || []);
      } else {
        setProjectMembers([]);
      }
    };
    if (isOpen) fetchProjectMembers();
  }, [isOpen, task?.projectId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [commentText]);

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [task?.title, task?.name, isOpen]);

  useEffect(() => {
    if (isOpen && task?.id) {
      loadComments();
      setTempDescription(task.description || "");
    }
  }, [isOpen, task?.id, task?.description]);

  const loadComments = async () => {
    setLoadingComments(true);
    try {
      const data = await commentService.getTaskComments(task.id);
      setComments(data);
    } catch (error) {
      console.error("Error loading task comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmittingComment || !commentText.trim() || !user || !task?.id) return;
    
    setIsSubmittingComment(true);
    try {
      await commentService.addTaskComment({
        taskId: task.id,
        projectId: task.projectId || task.project || "",
        userId: user.uid,
        userName: user.displayName || "Usuario",
        userPhoto: user.photoURL || undefined,
        text: commentText,
        ...(mentions.length > 0 && { mentions })
      });
      setCommentText("");
      setMentions([]);
      setShowMentions(false);
      loadComments();
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentChange = (val: string) => {
    setCommentText(val);
    const lastAtPos = val.lastIndexOf('@');
    if (lastAtPos !== -1 && lastAtPos >= val.length - 15) {
      const queryText = val.slice(lastAtPos + 1);
      setMentionSearch(queryText);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (targetUser: any) => {
    const lastAtPos = commentText.lastIndexOf('@');
    const textBefore = commentText.slice(0, lastAtPos);
    setCommentText(`${textBefore}@${targetUser.fullName} `);
    if (!mentions.includes(targetUser.uid)) {
      setMentions([...mentions, targetUser.uid]);
    }
    setShowMentions(false);
    setMentionSearch('');
  };

  const handleUpdate = async (fields: any) => {
    if (!task?.id) return;

    // Interceptar cambios desde 'canceled' para confirmar reactivación
    if (task.status === 'canceled' && fields.status && fields.status !== 'canceled') {
      setPendingStatus(fields.status);
      setShowReactivateConfirm(true);
      return;
    }

    if (onLocalUpdate) onLocalUpdate(task.id, fields);
    try {
      await projectService.updateTask(task.id, fields, task.projectId, user?.uid);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const confirmReactivate = async () => {
    if (!pendingStatus || !task?.id) return;
    
    const fields = { status: pendingStatus };
    if (onLocalUpdate) onLocalUpdate(task.id, fields);
    
    try {
      await projectService.updateTask(task.id, fields, task.projectId, user?.uid);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error reactivating task:", error);
    } finally {
      setShowReactivateConfirm(false);
      setPendingStatus(null);
    }
  };

  if (!isOpen || !task) return null;

  const isOwner = task.assignedTo?.includes(user?.uid);
  const canReactivate = isAdmin || isOwner;
  const isReadOnly = task.status === 'canceled' && !canReactivate;
  const creatorData = team.find(u => u.uid === task.createdBy);

  const formattedCreatedAt = task.createdAt?.toDate 
    ? task.createdAt.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : task.createdAt instanceof Date 
      ? task.createdAt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : task.createdAt || (task.id?.length > 10 ? 'Reciente' : 'N/A');

  return (
    <div className="fixed inset-0 md:inset-auto md:right-4 md:top-24 md:bottom-4 z-40 flex items-center justify-center md:items-stretch md:justify-end pointer-events-none p-4 md:p-0">
      {/* Drawer */}
      <div className="relative w-full md:w-[600px] max-h-[90vh] md:max-h-full glass border border-white/10 rounded-[32px] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-right duration-300 pointer-events-auto overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-purple-400" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">Detalles de Tarea</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-subtle">
          <section className="space-y-6">
            <div className="space-y-2">
              <textarea 
                ref={titleRef}
                key={task.id}
                value={task.title || task.name}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                rows={1}
                disabled={isReadOnly || isCollaborator}
                className={cn(
                  "text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 w-full hover:bg-white/[0.02] rounded-lg transition-colors resize-none overflow-hidden block",
                  (isReadOnly || isCollaborator) ? "text-slate-400 cursor-not-allowed" : "text-white"
                )}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </div>

            {/* Metadatos en formato tabla (2 columnas) */}
            <div className="grid grid-cols-[110px_1fr] items-center gap-x-4 gap-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-3xl shadow-inner">
              {/* Task Type */}
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</span>
              <div className="flex">
                <InlineDropdown 
                  value={task.type || 'Task'}
                  options={taskTypes.map(t => ({ value: t, label: t, icon: <div className="w-1.5 h-1.5 rounded-full bg-purple-500" /> }))}
                  onChange={(val) => handleUpdate({ type: val })}
                  disabled={isReadOnly}
                  trigger={
                    <div className="hover:scale-105 active:scale-95 transition-all cursor-pointer">
                      <Badge variant="purple" className="text-[10px]">
                        {task.type || 'Task'}
                      </Badge>
                    </div>
                  }
                />
              </div>

              {/* Priority */}
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prioridad</span>
              <div className="flex">
                <InlineDropdown 
                  value={task.priority || 'medium'}
                  options={priorityOptions.map(opt => ({ 
                    value: opt.value, 
                    label: opt.label, 
                    icon: opt.icon 
                  }))}
                  onChange={(val) => handleUpdate({ priority: val })}
                  disabled={isReadOnly}
                  trigger={
                    <div className="hover:scale-105 active:scale-95 transition-all cursor-pointer">
                      <Badge variant={getPriorityConfig(task.priority).variant} className="text-[10px]">
                        {getPriorityConfig(task.priority).label}
                      </Badge>
                    </div>
                  }
                />
              </div>

              {/* Status */}
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</span>
              <div className="flex">
                <InlineDropdown 
                  value={task.status}
                  onChange={(val) => handleUpdate({ status: val as TaskStatus })}
                  disabled={isReadOnly}
                  options={statusOptions
                    .filter(opt => {
                      if (opt.value === task.status) return true;
                      const allowed = ALLOWED_TRANSITIONS[task.status as TaskStatus] || [];
                      if (opt.value === 'published' && !isAdmin) return false;
                      return allowed.includes(opt.value as TaskStatus);
                    })
                    .map(opt => ({ 
                      value: opt.value, 
                      label: opt.label, 
                      icon: opt.icon 
                    }))}
                  trigger={
                    <div className="hover:scale-105 active:scale-95 transition-all cursor-pointer inline-block">
                      <Badge variant={statusOptions.find(s => s.value === task.status)?.variant || 'default'} className="text-[10px]">
                        {statusOptions.find(s => s.value === task.status)?.label || task.status}
                      </Badge>
                    </div>
                  }
                />
              </div>

              {/* Encargado (Assignee) */}
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Encargado</span>
              <div className="flex">
                <InlineDropdown
                  value={task.assignedTo?.[0] || ""}
                  onChange={(val) => handleUpdate({ assignedTo: val === 'unassigned' ? [] : [val] })}
                  options={[
                    { value: 'unassigned', label: 'Sin asignar', icon: <UserIcon size={12} className="text-slate-400" /> },
                    ...team.filter(u => !task.projectId || projectMembers.includes(u.uid)).map((u: any) => ({
                      value: u.uid,
                      label: u.fullName || 'Usuario',
                      icon: <UserAvatar src={u.photoURL} name={u.fullName || u.displayName} size="xs" className="w-4 h-4" />
                    }))
                  ]}
                  trigger={
                    <div className={cn(
                      "flex items-center gap-2 hover:bg-white/5 px-2 py-1 rounded-lg transition-all cursor-pointer border border-white/5",
                      (isReadOnly || isCollaborator) && "opacity-75 cursor-not-allowed"
                    )}>
                      {task.ownerData ? (
                        <>
                          <UserAvatar 
                            src={task.ownerData.photoURL} 
                            name={task.ownerData.fullName} 
                            size="xs" 
                            className="w-5 h-5"
                          />
                          <span className="text-xs font-bold text-slate-200">{task.ownerData.fullName}</span>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-slate-500 italic px-1">Sin asignar</span>
                      )}
                    </div>
                  }
                  disabled={isReadOnly || isCollaborator}
                  withSearch={true}
                />
              </div>

              {/* FECHA ENTREGA */}
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FECHA ENTREGA</span>
              <div className="flex">
                <CustomDatePicker
                  value={task.dueDate || ""}
                  onChange={(val) => handleUpdate({ dueDate: val })}
                  disabled={isReadOnly || isCollaborator}
                  trigger={
                    <div className={cn(
                      "hover:bg-white/5 px-2 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-2 border border-white/5",
                      (isReadOnly || isCollaborator) && "opacity-75 cursor-not-allowed"
                    )}>
                       <Calendar size={12} className={cn(isReadOnly || isCollaborator ? "text-slate-500" : "text-amber-400")} />
                       <span className={cn(
                         "text-xs font-bold",
                         task.dueDate ? "text-slate-200" : "text-slate-500"
                       )}>
                         {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sin fecha'}
                       </span>
                    </div>
                  }
                />
              </div>

              {/* Creador */}
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Creador</span>
              <div className="flex items-center gap-2 px-2">
                  <UserAvatar 
                    src={creatorData?.photoURL} 
                    name={creatorData?.fullName || task.creatorName} 
                    size="xs" 
                    className="w-5 h-5"
                  />
                <span className="text-xs font-bold text-slate-300">
                  {creatorData?.fullName || task.creatorName || "Sistema"}
                </span>
              </div>

              {/* FECHA CREADO */}
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FECHA CREADO</span>
              <div className="flex items-center gap-2 px-2">
                <Clock size={12} className="text-slate-500/60" />
                <span className="text-xs font-bold text-slate-400">{formattedCreatedAt}</span>
              </div>
            </div>

            {/* APPROVAL ACTIONS FOR ADMINS */}
            {isAdmin && task.status === 'pending-approval' && (
              <div className="flex items-center gap-2 p-3 bg-pink-500/5 rounded-2xl border border-pink-500/10">
                <button
                  onClick={() => handleUpdate({ 
                    status: 'published', 
                    approvedBy: profile?.uid, 
                    approvedAt: new Date() 
                  })}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Check size={14} /> Aprobar
                </button>
                <button
                  onClick={async () => {
                    await handleUpdate({ status: 'in-progress' });
                    await commentService.addTaskComment({
                      taskId: task.id,
                      projectId: task.projectId || task.project || "",
                      text: "Hey, esto no fue aprobado",
                      userId: user?.uid || "",
                      userName: profile?.fullName || "Admin",
                      userPhoto: user?.photoURL || undefined
                    });
                    loadComments();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                >
                  <X size={14} /> Rechazar
                </button>
              </div>
            )}
          </section>



          {task.approvedBy && (
            <section className="grid grid-cols-2 gap-6 bg-emerald-500/5 p-5 rounded-3xl border border-emerald-500/10 opacity-90 animate-in fade-in duration-500">
              <div className="space-y-2">
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={12} /> Aprobado por
                </p>
                <div className="flex items-center gap-2 p-1">
                    <UserAvatar 
                      src={team.find(u => u.uid === task.approvedBy)?.photoURL} 
                      name={team.find(u => u.uid === task.approvedBy)?.fullName} 
                      size="xs" 
                      className="w-5 h-5"
                    />
                  <p className="text-xs font-semibold text-emerald-400 truncate max-w-[100px]">
                    {team.find(u => u.uid === task.approvedBy)?.fullName || 'Admin'}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <History size={12} /> Aprobado el
                </p>
                <div className="p-1">
                  <p className="text-xs font-semibold text-emerald-400">
                    {task.approvedAt ? 
                      (task.approvedAt.toDate ? task.approvedAt.toDate().toLocaleString() : new Date(task.approvedAt).toLocaleString()) : 
                      '-'
                    }
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-6">
            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <AlignLeft size={14} className="text-slate-400" />
                <span>Descripción</span>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsEditingDescription(!isEditingDescription)}
                  className="p-1 px-2 hover:bg-white/5 rounded-lg text-[10px] font-bold text-purple-400 flex items-center gap-1.5 transition-all"
                >
                  <Edit3 size={12} /> {isEditingDescription ? 'Guardar' : 'Editar'}
                </button>
              )}
            </div>
            
            <div className="mb-8 relative group">
              {isEditingDescription && !isCollaborator && !isReadOnly ? (
                <div className="space-y-3">
                  <textarea
                    className="w-full text-slate-300 bg-slate-900 border-purple-500/30 rounded-2xl focus:ring-purple-500 focus:border-purple-500 p-4 min-h-[120px] transition-all resize-none shadow-inner"
                    value={tempDescription}
                    onChange={(e) => setTempDescription(e.target.value)}
                    placeholder="Agrega una descripción detallada..."
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setTempDescription(task.description || '');
                        setIsEditingDescription(false);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:bg-white/5 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        handleUpdate({ description: tempDescription });
                        setIsEditingDescription(false);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-purple-500 text-white hover:bg-purple-600 transition-all"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => !isCollaborator && !isReadOnly && setIsEditingDescription(true)}
                  className={cn(
                    "min-h-[60px] p-4 rounded-2xl bg-white/[0.01] border border-white/5 transition-all",
                    (!isCollaborator && !isReadOnly) ? "cursor-pointer hover:bg-white/[0.02] hover:border-purple-500/20" : "cursor-default"
                  )}
                >
                  {task.description ? (
                    <div className="text-sm text-slate-300 leading-relaxed">
                      <CommentText text={task.description} team={team} />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No hay descripción disponible</p>
                  )}
                  {!(isReadOnly || isCollaborator) && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-purple-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowUp size={12} />
                      <span>Click para editar descripción</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>


          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14} /> Conversación ({comments.length})
              </p>
            </div>
            
            <div className="space-y-4">
              {loadingComments ? (
                <div className="flex justify-center p-4">
                  <div className="w-5 h-5 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-6">
                  {comments.map(c => (
                    <Comment 
                      key={c.id}
                      name={c.userName}
                      time={c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString([], { month: 'numeric', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : "Reciente"}
                      text={c.text}
                      avatar={<UserAvatar src={c.userPhoto} name={c.userName} size="sm" className="w-full h-full" />}
                      isMe={c.userId === user?.uid}
                      team={team || []}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest text-center py-6 border border-dashed border-white/5 rounded-2xl">
                  Sin comentarios aún
                </p>
              ) }
            </div>
          </section>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-slate-900 border-t border-white/10">
          <form onSubmit={handleAddComment} className="relative group">
            {showMentions && (
              <div className="absolute bottom-full left-0 w-64 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-1.5 mb-2 animate-in slide-in-from-bottom-2 duration-200 z-50 max-h-48 overflow-y-auto scrollbar-subtle">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] p-2 border-b border-white/5 mb-1">Mencionar a...</p>
                {team.filter(u => u.fullName?.toLowerCase().includes(mentionSearch.toLowerCase())).map(u => (
                  <button 
                    key={u.uid}
                    type="button"
                    onClick={() => insertMention(u)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-purple-500/10 text-left transition-all group/item"
                  >
                      <UserAvatar 
                        src={u.photoURL} 
                        name={u.fullName} 
                        size="sm" 
                        className="w-7 h-7"
                      />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-200 font-bold truncate group-hover/item:text-purple-400 trasition-colors">{u.fullName}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-medium">{u.role || 'Miembro'}</p>
                    </div>
                  </button>
                ))}
                {team.filter(u => u.fullName?.toLowerCase().includes(mentionSearch.toLowerCase())).length === 0 && (
                  <p className="text-[10px] text-slate-600 font-bold uppercase text-center py-4">No se encontraron usuarios</p>
                )}
              </div>
            )}
            <textarea 
              ref={textareaRef}
              value={commentText}
              onChange={(e) => handleCommentChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleAddComment();
                }
                if (e.key === 'Escape' && showMentions) {
                  setShowMentions(false);
                }
              }}
              disabled={isSubmittingComment}
              placeholder="Escribe un mensaje... (Ctrl + Enter para enviar)" 
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-4 px-6 pr-14 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500/30 min-h-[52px] max-h-[200px] resize-none scrollbar-subtle transition-all overflow-y-auto block disabled:opacity-50"
            />
            <button 
              onClick={() => handleAddComment()}
              disabled={!commentText.trim() || isSubmittingComment}
              className="absolute bottom-1.5 right-1.5 p-3 bg-purple-600 rounded-xl text-white hover:bg-purple-500 disabled:opacity-20 disabled:grayscale transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center"
            >
              {isSubmittingComment ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </div>
        
        <div className="p-4 bg-white/5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={10} className="text-slate-600" />
            <span>ID: {task.id}</span>
          </div>
          <span>Actualizado hace poco</span>
        </div>
      </div>

      {/* Confirmation Modal for Reactivation */}
      {showReactivateConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowReactivateConfirm(false)}></div>
          <div className="relative glass-card bg-slate-900 w-full max-w-sm rounded-[2rem] overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/10 shadow-2xl">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                <AlertCircle size={32} className="text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Reactivar Tarea</h3>
                <p className="text-slate-400 text-sm">¿Estás seguro de que deseas volver a activar esta tarea? Volverá al flujo de trabajo activo.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReactivateConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-white text-xs font-bold hover:bg-white/10 transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReactivate}
                  className="flex-1 px-4 py-3 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
                >
                  Sí, Reactivar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Comment({ name, time, text, avatar, isMe, team }: { name: string, time: string, text: string, avatar: any, isMe?: boolean, team: any[] }) {
  return (
    <div className={`flex gap-3 ${isMe ? 'flex-row-reverse text-right' : ''}`}>
      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-[11px] font-bold text-slate-400 shrink-0 overflow-hidden">
        {avatar}
      </div>
      <div className={`space-y-1.5 max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
          <span className="text-xs font-bold text-white">{name}</span>
          <span className="text-[10px] text-slate-600 font-medium">{time}</span>
        </div>
        <div className={cn(
          "px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed transition-all relative overflow-hidden group/bubble",
          isMe 
            ? "bg-slate-900/40 backdrop-blur-xl text-slate-100 rounded-tr-none border border-white/10 border-t-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.25)]" 
            : "bg-white/5 backdrop-blur-sm text-slate-300 rounded-tl-none border border-white/5 shadow-sm"
        )}>
          {isMe && <div className="absolute inset-0 bg-gradient-to-b from-white/[0.08] to-transparent pointer-events-none" />}
          <CommentText text={text} team={team} />
        </div>
      </div>
    </div>
  );
}

