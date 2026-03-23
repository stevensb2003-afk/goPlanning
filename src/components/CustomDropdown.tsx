"use client";
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  color?: string;
  description?: string;
}

interface CustomDropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function CustomDropdown({ 
  value, 
  options, 
  onChange, 
  placeholder = "Seleccionar...", 
  label,
  className = "",
  disabled = false
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between gap-3 bg-slate-900/40 border border-white/5 hover:border-white/10 rounded-xl py-2.5 px-4 text-sm text-white transition-all focus:outline-none focus:ring-1 focus:ring-purple-500/30 ${isOpen ? 'ring-1 ring-purple-500/30 border-purple-500/30' : ''} ${disabled ? 'opacity-50 grayscale cursor-not-allowed hover:border-white/5' : ''}`}
        >
          <div className="flex items-center gap-3">
            {selectedOption?.icon && (
              <div className="text-slate-400 group-hover:text-white transition-colors">
                {selectedOption.icon}
              </div>
            )}
            <div className="flex flex-col items-start">
              <span className={`font-bold transition-colors ${selectedOption ? 'text-white' : 'text-slate-500'}`}>
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              {selectedOption?.description && (
                <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
                  {selectedOption.description}
                </span>
              )}
            </div>
          </div>
          <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-400' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-1.5 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="max-h-[240px] overflow-y-auto p-1.5 scrollbar-subtle">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl transition-all group ${value === option.value ? 'bg-purple-600/10 text-white' : 'hover:bg-white/5 text-slate-400 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-slate-800 border border-white/5 group-hover:scale-105"
                      style={{ 
                        backgroundColor: value === option.value ? `${option.color || '#A855F7'}20` : `${option.color || '#334155'}10`,
                        color: option.color || '#A855F7'
                      }}
                    >
                      {option.icon}
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold tracking-tight">{option.label}</span>
                      {option.description && (
                        <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{option.description}</span>
                      )}
                    </div>
                  </div>
                  {value === option.value && (
                    <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-600/20">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
