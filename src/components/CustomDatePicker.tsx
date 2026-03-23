"use client";
import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  trigger?: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
}

export default function CustomDatePicker({ 
  value, 
  onChange, 
  trigger, 
  className, 
  align = 'left',
  disabled = false
}: CustomDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [decadeStart, setDecadeStart] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, bottom: 0, left: 0, right: 0, width: 0 });
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right'>(align);
  const [verticalAlign, setVerticalAlign] = useState<'bottom' | 'top'>('bottom');
  
  // Parse incoming value or use current date for calendar view
  const initialDate = value ? parseISO(value) : new Date();
  const [currentMonth, setCurrentMonth] = useState(isValid(initialDate) ? initialDate : new Date());
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      
      // Auto-adjust alignment if space is limited on the right
      const menuWidth = 288; // w-72 matches this
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
      const menuEstimatedHeight = 360; // Calendar is tall
      
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
      const handleScroll = () => {
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
        const portalMenu = document.getElementById('datepicker-portal');
        if (portalMenu && portalMenu.contains(event.target as Node)) return;
        setIsOpen(false);
        setTimeout(() => setView('days'), 200);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const renderHeader = () => {
    let title = "";
    let onTitleClick = () => {};
    let onPrev = () => {};
    let onNext = () => {};

    if (view === 'days') {
      title = format(currentMonth, 'MMMM yyyy', { locale: es });
      onTitleClick = () => setView('months');
      onPrev = () => setCurrentMonth(subMonths(currentMonth, 1));
      onNext = () => setCurrentMonth(addMonths(currentMonth, 1));
    } else if (view === 'months') {
      title = format(currentMonth, 'yyyy', { locale: es });
      onTitleClick = () => {
        setDecadeStart(Math.floor(currentMonth.getFullYear() / 10) * 10);
        setView('years');
      };
      onPrev = () => setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1));
      onNext = () => setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1));
    } else if (view === 'years') {
      title = `${decadeStart} - ${decadeStart + 9}`;
      onTitleClick = () => {};
      onPrev = () => setDecadeStart(decadeStart - 10);
      onNext = () => setDecadeStart(decadeStart + 10);
    }

    return (
      <div className="flex justify-between items-center mb-4">
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ChevronLeft size={16} />
        </button>
        <button 
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); 
            if (view !== 'years') onTitleClick(); 
          }}
          className={cn(
            "text-sm font-bold text-white capitalize transition-colors px-2 py-1 rounded-md cursor-default",
            view !== 'years' && "hover:text-purple-400 hover:bg-white/5 cursor-pointer"
          )}
        >
          {title}
        </button>
        <button 
          type="button"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const defaultFormat = "EEEEEE";
    const startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });
    const days = [];
    for (let i = 0; i < 7; i++) {
        days.push(
            <div className="text-center font-bold text-[10px] text-slate-500 tracking-widest uppercase mb-2" key={i}>
                {format(addDays(startDate, i), defaultFormat, { locale: es }).substring(0, 2)}
            </div>
        );
    }
    return <div className="grid grid-cols-7 mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const selectedDate = value && value !== "" ? parseISO(value) : null;

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            formattedDate = format(day, "d");
            const cloneDay = day;
            const isSelected = selectedDate && isValid(selectedDate) && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            days.push(
                <div
                    className={cn(
                        "p-0.5 flex items-center justify-center",
                        !isCurrentMonth && "opacity-30"
                    )}
                    key={day.toString()}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange(format(cloneDay, 'yyyy-MM-dd'));
                      setIsOpen(false);
                      setTimeout(() => setView('days'), 200);
                    }}
                    className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all duration-200",
                        isSelected
                            ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105"
                            : isToday
                                ? "bg-slate-800 text-purple-400 border border-purple-500/30"
                                : "text-slate-300 hover:bg-white/10 hover:text-white hover:scale-105"
                    )}
                  >
                      {formattedDate}
                  </button>
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(<div className="grid grid-cols-7 gap-y-1" key={day.toString()}>{days}</div>);
        days = [];
    }
    return <div>{rows}</div>;
  };

  const renderMonths = () => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(currentMonth.getFullYear(), i, 1);
      const isCurrentMonth = isSameMonth(monthDate, new Date());
      
      months.push(
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentMonth(monthDate);
            setView('days');
          }}
          className={cn(
            "h-10 w-full flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 capitalize",
            isCurrentMonth
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          {format(monthDate, 'MMM', { locale: es })}
        </button>
      )
    }
    return <div className="grid grid-cols-3 gap-x-2 gap-y-4 py-2 mb-2">{months}</div>;
  };

  const renderYears = () => {
    const years = [];
    for (let i = 0; i < 12; i++) {
      const year = decadeStart - 1 + i;
      const isCurrentYear = year === new Date().getFullYear();
      const isSelectedYear = year === currentMonth.getFullYear();
      const isOutsideDecade = i === 0 || i === 11;
      
      years.push(
        <button
          key={year}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCurrentMonth(new Date(year, currentMonth.getMonth(), 1));
            setView('months');
          }}
          className={cn(
            "h-10 w-full flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200",
            isSelectedYear
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105"
              : isCurrentYear
                ? "bg-slate-800 text-purple-400 border border-purple-500/30"
                : isOutsideDecade
                  ? "text-slate-500 hover:text-slate-400 hover:bg-white/5"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
          )}
        >
          {year}
        </button>
      )
    }
    return <div className="grid grid-cols-3 gap-x-2 gap-y-4 py-2 mb-2">{years}</div>;
  };

  const datePickerMenu = (
    <div 
      id="datepicker-portal"
      style={{
        position: 'fixed',
        ...(verticalAlign === 'bottom' 
            ? { top: `${coords.top + (containerRef.current?.getBoundingClientRect().height || 0) + 8}px` } 
            : { bottom: `${coords.bottom + 8}px` }
        ),
        left: effectiveAlign === 'right' ? 'auto' : `${Math.max(8, coords.left)}px`,
        right: effectiveAlign === 'right' ? `${Math.max(8, window.innerWidth - coords.right)}px` : 'auto',
      }}
      className={cn(
        "z-[9999] w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {renderHeader()}
      
      {view === 'days' && (
        <>
          {renderDays()}
          {renderCells()}
        </>
      )}

      {view === 'months' && renderMonths()}
      
      {view === 'years' && renderYears()}
      
      {view === 'days' && (
        <div className="mt-4 pt-3 border-t border-white/5 flex gap-2">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(""); setIsOpen(false); }}
            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all outline-none"
          >
            Limpiar
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(format(new Date(), 'yyyy-MM-dd')); setIsOpen(false); }}
            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 transition-all outline-none"
          >
            Hoy
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div 
        onClick={(e) => { 
          e.stopPropagation(); 
          if (disabled) return;
          if (!isOpen) {
            updateCoords();
            setView('days');
          }
          setIsOpen(!isOpen); 
        }} 
        className="cursor-pointer h-full flex items-center w-full"
      >
        {trigger ? trigger : (
          <div className="flex items-center gap-2 h-full w-full"> 
             <span className="text-slate-400 hover:text-white transition-colors">
                <CalendarIcon size={16} />
             </span>
          </div>
        )}
      </div>

      {isOpen && mounted && createPortal(datePickerMenu, document.body)}
    </div>
  );
}

