"use client";
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface InlineDropdownProps {
  trigger: React.ReactNode;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  withSearch?: boolean;
  align?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
}

export default function InlineDropdown({ 
  trigger, 
  value, 
  options, 
  onChange, 
  withSearch = false,
  align = 'left',
  className = "",
  disabled = false
}: InlineDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, right: 0, width: 0 });
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right'>(align);
  const [verticalAlign, setVerticalAlign] = useState<'bottom' | 'top'>('bottom');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      
      // Auto-adjust alignment if space is limited on the right
      const menuWidth = 208; // w-52 matches this
      const windowWidth = window.innerWidth;
      const spaceRight = windowWidth - rect.left;
      
      let newAlign = align;
      if (align === 'left' && spaceRight < menuWidth + 20) {
        newAlign = 'right';
      } else if (align === 'right' && rect.right < menuWidth + 20) {
        newAlign = 'left';
      }
      setEffectiveAlign(newAlign);

      // Check vertical space
      const windowHeight = window.innerHeight;
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;
      const menuEstimatedHeight = 250; // max-h-56 (224px) + input if search
      
      if (spaceBelow < menuEstimatedHeight && spaceAbove > spaceBelow) {
        setVerticalAlign('top');
      } else {
        setVerticalAlign('bottom');
      }

      setCoords({
        top: rect.top,
        bottom: window.innerHeight - rect.top,
        left: rect.left,
        right: rect.right,
        width: rect.width
      });
    }
  };

  useLayoutEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
      // Close on scroll to avoid alignment issues, or we could update coords
      const handleScroll = (e: Event) => {
        // Prevent closing if we're scrolling inside the dropdown content itself
        const dropdown = document.getElementById('inline-dropdown-portal');
        if (dropdown && dropdown.contains(e.target as Node)) return;
        setIsOpen(false);
      };
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('resize', updateCoords);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Only close if we didn't click inside the portal
        const portalMenu = document.getElementById('inline-dropdown-portal');
        if (portalMenu && portalMenu.contains(event.target as Node)) return;
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filtered = withSearch 
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase())) 
    : options;

  const dropdownMenu = (
    <div 
      id="inline-dropdown-portal"
      style={{
        position: 'fixed',
        ...(verticalAlign === 'bottom' 
            ? { top: `${coords.top + (containerRef.current?.getBoundingClientRect().height || 0) + 8}px` } 
            : { bottom: `${coords.bottom + 8}px` }
        ),
        left: effectiveAlign === 'right' ? 'auto' : `${Math.max(8, coords.left)}px`,
        right: effectiveAlign === 'right' ? `${Math.max(8, window.innerWidth - coords.right)}px` : 'auto',
      }}
      className={`z-[9999] w-52 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 animate-in fade-in zoom-in-95 duration-200`}
      onClick={(e) => e.stopPropagation()}
    >
      {withSearch && (
        <div className="mb-1.5 p-1 relative">
          <input 
            autoFocus 
            placeholder="Buscar..." 
            className="w-full bg-black/20 text-xs text-white px-3 py-2 rounded-xl border border-white/5 focus:outline-none focus:border-purple-500/50 transition-all font-medium" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}
      <div className="max-h-56 overflow-y-auto scrollbar-subtle">
         {filtered.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`w-full text-left px-3 py-2 text-xs rounded-xl transition-all flex items-center gap-2.5 
                ${value === opt.value ? 'bg-purple-500/20 text-white font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white font-medium'}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.icon && opt.icon}
              {opt.label}
            </button>
         ))}
         {filtered.length === 0 && <div className="text-center text-[10px] uppercase tracking-widest text-slate-500 py-3 font-bold">Sin resultados</div>}
      </div>
    </div>
  );

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div         onClick={(e) => { 
           if (disabled) return;
           e.stopPropagation(); 
           if (!isOpen) updateCoords();
           setIsOpen(!isOpen); 
           setSearch(""); 
         }} 
         className={cn("h-full flex items-center w-max", !disabled && "cursor-pointer", disabled && "opacity-50 cursor-not-allowed")}
       >
        {trigger}
      </div>
      {isOpen && mounted && createPortal(dropdownMenu, document.body)}
    </div>
  );
}

