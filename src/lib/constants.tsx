import { Circle, Clock, Snowflake, CheckCircle2, XCircle, ArrowDown, Minus, ArrowUp, AlertCircle } from 'lucide-react';
import { TaskStatus } from '@/lib/services/projectService';

export const statusOptions = [
  { value: 'todo' as const, label: 'Pendiente', icon: <Circle size={14} />, color: '#94a3b8', variant: 'slate' as const },
  { value: 'in-progress' as const, label: 'En Progreso', icon: <Clock size={14} />, color: '#38bdf8', variant: 'cyan' as const },
  { value: 'pending-approval' as const, label: 'Por Aprobar', icon: <Clock size={14} />, color: '#f472b6', variant: 'pink' as const },
  { value: 'published' as const, label: 'Publicar / Compartir', icon: <Clock size={14} />, color: '#818cf8', variant: 'indigo' as const },
  { value: 'frozen' as const, label: 'Congelado', icon: <Snowflake size={14} />, color: '#fbbf24', variant: 'amber' as const },
  { value: 'done' as const, label: 'Completado', icon: <CheckCircle2 size={14} />, color: '#34d399', variant: 'emerald' as const },
  { value: 'canceled' as const, label: 'Cancelado', icon: <XCircle size={14} />, color: '#f87171', variant: 'rose' as const },
];

export const priorityOptions = [
  { value: 'low' as const, label: 'Baja', icon: <ArrowDown size={14} />, variant: 'slate' as const },
  { value: 'medium' as const, label: 'Media', icon: <Minus size={14} />, variant: 'indigo' as const },
  { value: 'high' as const, label: 'Alta', icon: <ArrowUp size={14} />, variant: 'amber' as const },
  { value: 'urgent' as const, label: 'Urgente', icon: <AlertCircle size={14} />, variant: 'rose' as const },
];

export function getStatusConfig(status: TaskStatus) {
  return statusOptions.find(opt => opt.value === status) || statusOptions[0];
}

export function getPriorityConfig(priority?: string) {
  return priorityOptions.find(opt => opt.value === priority) || priorityOptions[1];
}
