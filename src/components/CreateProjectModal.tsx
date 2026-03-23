"use client";
import { useState } from 'react';
import { X, Save, Palette, Calendar } from 'lucide-react';
import { projectService } from '@/lib/services/projectService';
import { useAuth } from '@/context/AuthContext';
import { configService } from '@/lib/services/configService';
import { useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import CustomDropdown from './CustomDropdown';
import CustomDatePicker from './CustomDatePicker';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

const COLORS = [
  "#A855F7", // Purple
  "#22D3EE", // Cyan
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#10B981", // Emerald
  "#6366F1", // Indigo
];

export default function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [projectType, setProjectType] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isDateRange, setIsDateRange] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchTypes = async () => {
      const config = await configService.getConfig();
      setProjectTypes(config.projectTypes);
      if (config.projectTypes.length > 0) {
        setProjectType(config.projectTypes[0]);
      }
    };
    fetchTypes();
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSubmitting(true);
    try {
      await projectService.createProject({
        title,
        category: projectType, // Keeping 'category' in DB for compatibility, but user sees 'tipo'
        type: projectType,
        description,
        progress: 0,
        members: [profile.uid],
        color,
        createdBy: profile.uid,
        startDate,
        endDate: isDateRange ? endDate : startDate,
        isDateRange,
      });
      showToast('Proyecto creado con éxito', 'success');
      onProjectCreated();
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setIsDateRange(false);
      if (projectTypes.length > 0) setProjectType(projectTypes[0]);
      setColor(COLORS[0]);
    } catch (error: any) {
      console.error("Error creating project:", error);
      showToast('Error al crear el proyecto: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass w-full max-w-xl rounded-t-[40px] sm:rounded-[40px] border-t sm:border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 max-h-[92vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 sm:px-8 py-4 sm:py-8 border-b border-white/5">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Nuevo Proyecto</h2>
            <p className="text-slate-400 text-sm mt-1">Inicia una nueva aventura audiovisual para la iglesia.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 sm:px-8 py-6 sm:py-8 space-y-4 sm:space-y-6 overflow-y-auto scrollbar-subtle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Título del Proyecto</label>
              <input 
                type="text" 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Vídeo de Pascua 2024"
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Tipo de Proyecto</label>
              <CustomDropdown
                value={projectType}
                onChange={setProjectType}
                options={projectTypes.map(type => ({ label: type, value: type }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Descripción / Objetivo</label>
              <textarea 
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="¿Qué queremos lograr con este proyecto?"
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
              />
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
                <Palette size={12} />
                Color Distintivo
              </label>
              <div className="flex flex-wrap gap-3">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-xl transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-110' : 'opacity-50 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Configuración de Tiempo</label>
              <div className="flex p-1 bg-slate-900 border border-white/5 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setIsDateRange(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${!isDateRange ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Calendar size={14} />
                  Fecha Única
                </button>
                <button
                  type="button"
                  onClick={() => setIsDateRange(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isDateRange ? 'premium-gradient text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Calendar size={14} />
                  Rango de Fechas
                </button>
              </div>
            </div>

            {!isDateRange ? (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Fecha del Proyecto</label>
                <CustomDatePicker 
                  value={startDate}
                  onChange={(date) => {
                    setStartDate(date);
                    setEndDate(date);
                  }}
                  trigger={
                    <div className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-sm text-slate-300 flex justify-between items-center cursor-pointer hover:border-white/10 transition-all">
                      <span>{startDate || "Seleccionar fecha..."}</span>
                      <Calendar size={16} className="text-slate-500" />
                    </div>
                  }
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Fecha de Inicio</label>
                  <CustomDatePicker 
                    value={startDate}
                    onChange={setStartDate}
                    trigger={
                      <div className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-sm text-slate-300 flex justify-between items-center cursor-pointer hover:border-white/10 transition-all">
                        <span>{startDate || "Seleccionar..."}</span>
                        <Calendar size={16} className="text-slate-500" />
                      </div>
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Fecha de Fin (Entrega)</label>
                  <CustomDatePicker 
                    value={endDate}
                    onChange={setEndDate}
                    align="right"
                    trigger={
                      <div className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-sm text-slate-300 flex justify-between items-center cursor-pointer hover:border-white/10 transition-all">
                        <span>{endDate || "Seleccionar..."}</span>
                        <Calendar size={16} className="text-slate-500" />
                      </div>
                    }
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="premium-gradient px-8 py-3 rounded-2xl text-sm font-bold text-white shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save size={18} />
                  Crear Proyecto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
