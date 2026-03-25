"use client";
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Badge from './Badge';
import { 
  MoreHorizontal, 
  MessageSquare, 
  User, 
  Users, 
  Plus, 
  Calendar,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Check,
  X,
  ShieldCheck,
  Link as LinkIcon,
  RotateCcw
} from 'lucide-react';
import { Task, Project, projectService, TaskStatus, ALLOWED_TRANSITIONS } from '@/lib/services/projectService';
import { statusOptions, priorityOptions, getStatusConfig, getPriorityConfig } from '@/lib/constants';
import { UserProfile } from '@/lib/services/userService';
import { commentService } from '@/lib/services/commentService';
import { serverTimestamp } from 'firebase/firestore';
import CustomDatePicker from './CustomDatePicker';
import InlineDropdown from './InlineDropdown';
import { cn } from '@/lib/utils';
import UserAvatar from './UserAvatar';

interface TaskTableProps {
  tasks: Task[];
  projects: Project[];
  team: UserProfile[];
  taskTypes: string[];
  onUpdate: () => void;
  onLocalUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskClick: (task: Task) => void;
  isAdmin?: boolean;
  isPendingView?: boolean;
  isCompletedView?: boolean;
  currentUserProfile?: UserProfile | null;
}



export default function TaskTable({ tasks, projects, team, taskTypes, onUpdate, onLocalUpdate, onTaskClick, isAdmin, isPendingView, isCompletedView, currentUserProfile }: TaskTableProps) {
  const isCollaborator = currentUserProfile?.baseRole === 'collaborator';
  
  // -- Reactivation Confirmation State --
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
  const [pendingTaskToReactivate, setPendingTaskToReactivate] = useState<{id: string, status: TaskStatus} | null>(null);

  const canReactivate = (task: Task) => {
    if (!currentUserProfile) return false;
    const isAdmin = currentUserProfile.baseRole === 'admin' || currentUserProfile.email === 'info@v-creations.com';
    const proj = projects.find(p => p.id === task.projectId);
    const isOwner = proj?.createdBy === currentUserProfile.uid;
    return isAdmin || isOwner;
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    // If trying to change FROM canceled, check permissions and show confirmation
    if (task.status === 'canceled') {
      if (!canReactivate(task)) {
        return; // UI should have disabled the dropdown anyway
      }
      setPendingTaskToReactivate({ id: task.id!, status: newStatus });
      setShowReactivateConfirm(true);
      return;
    }

    // Normal update
    try {
      onLocalUpdate(task.id!, { status: newStatus });
      await projectService.updateTask(task.id!, { status: newStatus }, task.projectId, currentUserProfile?.uid);
      onUpdate();
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const confirmReactivate = async () => {
    if (!pendingTaskToReactivate) return;
    try {
      onLocalUpdate(pendingTaskToReactivate.id, { status: pendingTaskToReactivate.status });
      await projectService.updateTask(pendingTaskToReactivate.id, { status: pendingTaskToReactivate.status }, undefined, currentUserProfile?.uid);
      onUpdate();
      setShowReactivateConfirm(false);
      setPendingTaskToReactivate(null);
    } catch (err) {
      console.error("Error reactivating task:", err);
    }
  };

  if (!tasks || tasks.length === 0) {
    return (
      <div className="glass rounded-3xl overflow-hidden border border-white/5 p-12 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5">
          <CheckCircle2 size={24} className="text-slate-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">No hay tareas</h3>
          <p className="text-sm text-slate-500 mt-1">No se encontraron tareas con estos filtros o aún no te han asignado ninguna.</p>
        </div>
      </div>
    );
  }

  const getProjectName = (projectId?: string) => {
    if (!projectId) return '(Independiente)';
    const proj = projects.find(p => p.id === projectId);
    return proj?.title || '(Independiente)';
  };

  return (
    <div className="glass rounded-3xl overflow-hidden border border-white/5">
      <div className="overflow-x-auto scrollbar-subtle">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead className="bg-white/5 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Tarea</th>
              <th className="px-6 py-4">Proyecto</th>
              <th className="px-6 py-4">Prioridad</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Encargado</th>
              {!isCompletedView && <th className="px-6 py-4">Estado</th>}
              <th className="px-6 py-4">Entrega</th>
              {isCompletedView && <th className="px-6 py-4">Finalizado</th>}
              {isCompletedView && <th className="px-6 py-4">Estado Tiempo</th>}
              {isPendingView && isAdmin && <th className="px-6 py-4">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tasks.map((task) => {
              const proj = projects.find(p => p.id === task.projectId);
              const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
              
              return (
                <tr key={task.id} className="hover:bg-white/[0.02] transition-colors group">
                  {/* TITLE */}
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => onTaskClick(task)}
                      className="flex flex-col gap-1 text-left hover:translate-x-1 transition-transform"
                    >
                      <span className={cn(
                        "text-sm font-bold transition-colors uppercase tracking-tight group-hover:text-purple-400",
                        task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'
                      )}>
                        {task.title}
                      </span>
                    </button>
                  </td>

                  {/* PROJECT */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {proj && (
                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color }} />
                       )}
                       <span className="text-xs text-slate-400 font-medium truncate max-w-[150px]">
                         {getProjectName(task.projectId)}
                       </span>
                    </div>
                  </td>

                  {/* PRIORITY */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <InlineDropdown
                      value={task.priority || "medium"}
                      onChange={async (val: string) => {
                        onLocalUpdate(task.id!, { priority: val as any });
                        await projectService.updateTask(task.id!, { priority: val as any }, task.projectId, currentUserProfile?.uid);
                        onUpdate();
                      }}
                      trigger={
                        <div className="hover:scale-105 active:scale-95 transition-all cursor-pointer inline-block">
                          <Badge variant={getPriorityConfig(task.priority).variant} className="text-[10px] md:text-xs">
                            {getPriorityConfig(task.priority).label}
                          </Badge>
                        </div>
                      }
                      options={priorityOptions.map(p => ({ value: p.value, label: p.label, icon: p.icon }))}
                    />
                  </td>

                  {/* TYPE */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <InlineDropdown
                      value={task.type || ""}
                      onChange={async (val: string) => {
                        onLocalUpdate(task.id!, { type: val });
                        await projectService.updateTask(task.id!, { type: val }, task.projectId, currentUserProfile?.uid);
                        onUpdate();
                      }}
                      trigger={
                        <div className="hover:scale-105 active:scale-95 transition-all cursor-pointer">
                          <span className={cn(
                            "text-[10px] md:text-xs font-bold uppercase tracking-widest px-2 py-1 rounded-md border inline-block whitespace-nowrap",
                            task.type ? "bg-cyan-400/5 text-cyan-400 border-cyan-400/10" : "bg-slate-800/50 text-slate-500 border-dashed border-slate-600"
                          )}>
                            {task.type || 'TIPO'}
                          </span>
                        </div>
                      }
                      options={taskTypes.map(t => ({ value: t, label: t, icon: <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> }))}
                    />
                  </td>

                  {/* ASSIGNEE */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <InlineDropdown
                      value={task.assignedTo?.[0] || ""}
                      onChange={async (val: string) => {
                        const newAssigned = val === 'unassigned' ? [] : [val];
                        onLocalUpdate(task.id!, { assignedTo: newAssigned });
                        await projectService.updateTask(task.id!, { assignedTo: newAssigned }, task.projectId, currentUserProfile?.uid);
                        onUpdate();
                      }}
                      withSearch={true}
                      trigger={
                        <div className="hover:scale-110 active:scale-90 transition-all flex items-center cursor-pointer">
                          {task.assignedTo && task.assignedTo.length > 0 ? (
                            <div className="flex items-center -space-x-2 relative z-0">
                              {task.assignedTo.map(uid => {
                                const u = team.find(ut => ut.uid === uid);
                                return (
                                    <UserAvatar 
                                      key={uid}
                                      src={u?.photoURL} 
                                      name={u?.fullName || u?.displayName} 
                                      size="sm" 
                                      className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden z-10 hover:z-20 transition-all shadow-lg"
                                      title={u?.fullName || 'Usuario'}
                                    />
                                );
                              })}
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-800/50 border border-dashed border-slate-600 flex items-center justify-center text-slate-500 transition-colors" title="Asignar Dueño">
                              <Users size={14} />
                            </div>
                          )}
                        </div>
                      }
                      options={[
                        { value: 'unassigned', label: 'Sin asignar', icon: <Users size={14} /> },
                        ...team.filter(u => {
                          if (task.projectId) {
                            const proj = projects.find(p => p.id === task.projectId);
                            if (proj && proj.members) {
                              return proj.members.includes(u.uid);
                            }
                            return false; // If project not found but task has projectId, don't show anyone? Or show all? Rule says only involved.
                          }
                          return true;
                        }).map(u => ({
                          value: u.uid,
                          label: u.fullName || 'Usuario',
                          icon: <UserAvatar src={u.photoURL} name={u.fullName || u.displayName} size="xs" className="w-4 h-4" />
                        }))
                      ]}
                      disabled={isCollaborator}
                    />

                  </td>

                  {/* STATUS (Only in active view) */}
                  {!isCompletedView && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <InlineDropdown
                        value={task.status}
                        onChange={(val: string) => handleStatusChange(task, val as TaskStatus)}
                        trigger={
                          <div className={cn(
                            "hover:scale-105 active:scale-95 transition-all inline-block",
                            task.status === 'canceled' && !canReactivate(task) ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                          )}>
                            <Badge variant={getStatusConfig(task.status).variant} className="text-xs">
                              {getStatusConfig(task.status).label}
                            </Badge>
                          </div>
                        }
                        options={statusOptions
                          .filter(opt => {
                            if (opt.value === task.status) return true;
                            
                            // If canceled, only admins/owners can reactivate
                            if (task.status === 'canceled') {
                              return canReactivate(task) && (opt.value === 'todo' || opt.value === 'in-progress');
                            }

                            const allowed = ALLOWED_TRANSITIONS[task.status] || [];
                            if (opt.value === 'published' && !isAdmin) return false;
                            return allowed.includes(opt.value as TaskStatus);
                          })
                          .map(s => ({ value: s.value, label: s.label, icon: s.icon }))}
                      />
                    </td>
                  )}

                  {/* DUEDATE */}
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <CustomDatePicker
                      value={task.dueDate || ""}
                      onChange={async (val) => {
                        onLocalUpdate(task.id!, { dueDate: val });
                        await projectService.updateTask(task.id!, { dueDate: val }, task.projectId, currentUserProfile?.uid);
                        onUpdate();
                      }}
                      align="left"
                      disabled={isCompletedView || isCollaborator}

                      trigger={
                        <div className={cn(
                          "transition-all",
                          isCompletedView ? "opacity-70" : "hover:scale-105 active:scale-95 cursor-pointer"
                        )}>
                          <span className={cn(
                            "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 px-2 py-1.5 rounded-md whitespace-nowrap",
                            !task.dueDate ? "text-slate-500 bg-slate-800/50 border border-dashed border-slate-600" 
                            : isOverdue ? "text-rose-400 bg-rose-500/10 border border-rose-500/20" 
                            : "text-slate-400 bg-white/[0.02] border border-white/5"
                          )}>
                            <Calendar size={14} /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-CR', { day: '2-digit', month: 'short' }) : 'SIN FECHA'}
                          </span>
                        </div>
                      }
                    />
                  </td>


                  {/* COMPLETED AT (Only in completed view) */}
                  {isCompletedView && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                          <CheckCircle2 size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white uppercase tracking-tight">
                            {(() => {
                              const completionTimestamp = task.completedAt || (task.status === 'done' ? task.updatedAt : null);
                              if (!completionTimestamp) return '---';
                              const date = completionTimestamp.toDate?.() || new Date(completionTimestamp);
                              return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                            })()}
                          </span>
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
                            {(() => {
                              const completionTimestamp = task.completedAt || (task.status === 'done' ? task.updatedAt : null);
                              if (!completionTimestamp) return '';
                              const date = completionTimestamp.toDate?.() || new Date(completionTimestamp);
                              return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                            })()}
                          </span>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* TIME STATUS (Only in completed view) */}
                  {isCompletedView && (
                    <td className="px-6 py-4">
                      {(() => {
                        const dueDate = task.dueDate ? new Date(task.dueDate + "T23:59:59") : null;
                        const completionTimestamp = task.completedAt || (task.status === 'done' ? task.updatedAt : null);
                        const completedDate = completionTimestamp?.toDate?.() || (completionTimestamp ? new Date(completionTimestamp) : null);
                        
                        if (!dueDate || !completedDate) {
                          return (
                            <Badge variant="slate" className="text-[10px] opacity-50">SIN DATOS</Badge>
                          );
                        }

                        // Reset hours for comparison if we only care about days, but here we have full timestamps
                        // Usually dueDate is a string like "YYYY-MM-DD"
                        const isOnTime = completedDate <= new Date(task.dueDate + "T23:59:59");

                        return isOnTime ? (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            <ShieldCheck size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">A Tiempo</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
                            <XCircle size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Con Retraso</span>
                          </div>
                        );
                      })()}
                    </td>
                  )}

                  {/* APPROVAL ACTIONS */}
                  {isPendingView && isAdmin && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            onLocalUpdate(task.id!, { 
                              status: 'published', 
                              approvedBy: currentUserProfile?.uid, 
                              approvedAt: new Date() 
                            });
                            await projectService.updateTask(task.id!, { 
                              status: 'published', 
                              approvedBy: currentUserProfile?.uid, 
                              approvedAt: serverTimestamp() 
                            }, task.projectId, currentUserProfile?.uid);
                            onUpdate();
                          }}
                          className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 group/btn"
                          title="Aprobar Tarea"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            onLocalUpdate(task.id!, { status: 'in-progress' });
                            await projectService.updateTask(task.id!, { status: 'in-progress' }, task.projectId, currentUserProfile?.uid);
                            await commentService.addTaskComment({
                              taskId: task.id!,
                              projectId: task.projectId || 'independent',
                              text: "Hey, esto no fue aprobado",
                              userId: currentUserProfile?.uid || '',
                              userName: currentUserProfile?.fullName || 'Admin',
                              userPhoto: currentUserProfile?.photoURL || ''
                            });
                            onUpdate();
                          }}
                          className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/10 group/btn"
                          title="Rechazar Tarea"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reactivation Confirmation Modal */}
      {showReactivateConfirm && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                  setShowReactivateConfirm(false);
                  setPendingTaskToReactivate(null);
                }}
                className="flex-1 py-4 text-xs font-black text-slate-500 hover:text-white transition-all uppercase tracking-widest"
              >
                CANCELAR
              </button>
              <button 
                onClick={confirmReactivate}
                className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-xs font-black text-white shadow-lg shadow-emerald-600/20 transition-all uppercase tracking-widest"
              >
                SÍ, ACTIVAR
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}



