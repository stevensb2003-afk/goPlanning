"use client";
import { useState, useEffect } from 'react';
import { X, Calendar, Layers, Type, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { projectService, Project } from '@/lib/services/projectService';
import { configService } from '@/lib/services/configService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import CustomDropdown from './CustomDropdown';
import CustomDatePicker from './CustomDatePicker';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projects: Project[];
}

export default function NewTaskModal({ isOpen, onClose, onSuccess, projects }: NewTaskModalProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('none');
  const [taskType, setTaskType] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskTypes, setTaskTypes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const config = await configService.getConfig();
        setTaskTypes(config.taskTypes || []);
        if (config.taskTypes && config.taskTypes.length > 0) {
          setTaskType(config.taskTypes[0]);
        }
      } catch (error) {
        console.error("Error fetching config:", error);
      }
    };
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await projectService.createTask({
        title,
        description,
        link,
        ...(selectedProjectId !== 'none' ? { projectId: selectedProjectId } : {}),
        type: taskType,
        dueDate,
        status: 'todo',
        priority,
        assignedTo: [],
        createdBy: profile?.uid,
        creatorName: profile?.fullName || profile?.displayName || "Sistema",
        creatorPhoto: profile?.photoURL || undefined
      });
       onSuccess();
       showToast("¡Tarea creada con éxito!", "success");
       
       if (createAnother) {
        setTitle('');
        setDescription('');
        setLink('');
        // Keep project and type as they might want to create similar tasks
      } else {
        setTitle('');
        setDescription('');
        setLink('');
        setSelectedProjectId('none');
        setDueDate('');
        onClose();
      }
    } catch (error: any) {
      console.error("Error creating task:", error);
      showToast("Error al crear la tarea: " + (error.message || "Error desconocido"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const projectOptions = [
    { label: 'Ninguno (Tarea Independiente)', value: 'none', icon: <Layers size={14} />, color: '#64748b' },
    ...projects.map(p => ({
      label: p.title,
      value: p.id!,
      icon: <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />,
      color: p.color
    }))
  ];

  const typeOptions = taskTypes.map(t => ({
    label: t,
    value: t,
    icon: <Type size={14} />,
    color: '#A855F7'
  }));

  const priorityOptions = [
    { label: 'Baja', value: 'low', icon: <div className="w-2 h-2 rounded-full bg-slate-400" />, color: '#94a3b8' },
    { label: 'Media', value: 'medium', icon: <div className="w-2 h-2 rounded-full bg-indigo-400" />, color: '#818cf8' },
    { label: 'Alta', value: 'high', icon: <div className="w-2 h-2 rounded-full bg-amber-400" />, color: '#fbbf24' },
    { label: 'Urgente', value: 'urgent', icon: <div className="w-2 h-2 rounded-full bg-rose-400" />, color: '#f87171' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-[#0B1120] border-t sm:border border-white/5 rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[92vh] sm:max-h-[90vh]">
        <div className="px-6 sm:px-8 py-4 sm:py-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <h2 className="text-xl font-bold text-white tracking-tight">Nueva Tarea</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all outline-none">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6 overflow-y-auto scrollbar-subtle">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Título de la Tarea</label>
              <input
                autoFocus
                type="text"
                placeholder="Ej: Diseñar logo, Redactar informe..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomDropdown
                label="Vincular a Proyecto"
                value={selectedProjectId}
                options={projectOptions}
                onChange={setSelectedProjectId}
              />
              <CustomDropdown
                label="Tipo de Tarea"
                value={taskType}
                options={typeOptions}
                onChange={setTaskType}
              />
              <CustomDropdown
                label="Prioridad"
                value={priority}
                options={priorityOptions}
                onChange={(val: any) => setPriority(val)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 block">Fecha de Entrega</label>
              <CustomDatePicker
                value={dueDate}
                onChange={setDueDate}
                trigger={
                  <div className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 px-4 text-white flex items-center gap-3 cursor-pointer hover:border-white/10 transition-all">
                    <Calendar size={18} className="text-slate-500" />
                    <span className={dueDate ? 'text-white font-medium text-sm' : 'text-slate-600 font-medium text-sm'}>
                      {dueDate || 'Seleccionar fecha...'}
                    </span>
                  </div>
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Descripción (Opcional)</label>
              <textarea
                placeholder="Añade más detalles sobre esta tarea..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 px-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all min-h-[100px] resize-none font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Enlace Externo (Google Drive, Canva, etc.)</label>
              <div className="relative">
                <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="url"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-medium text-sm"
                />
              </div>
            </div>
 
            <div className="flex items-center gap-2 pl-2">
              <input
                type="checkbox"
                id="createAnother"
                checked={createAnother}
                onChange={(e) => setCreateAnother(e.target.checked)}
                className="w-4 h-4 rounded border-white/10 bg-slate-900 text-purple-600 focus:ring-purple-500/50 cursor-pointer"
              />
              <label htmlFor="createAnother" className="text-sm text-slate-400 cursor-pointer select-none">
                Crear otra después de guardar
              </label>
            </div>
          </div>

          <div className="pt-2 sm:pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 sm:py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-400 hover:bg-white/5 transition-all outline-none border border-white/5 uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
              className="flex-[2] py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:grayscale disabled:translate-y-0 outline-none uppercase tracking-widest"
            >
              {isSubmitting ? 'Creando...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
