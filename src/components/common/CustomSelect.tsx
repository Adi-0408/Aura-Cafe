import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: (SelectOption<T> | T)[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  prefix?: React.ReactNode;
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  className = '',
  buttonClassName = '',
  menuClassName = '',
  disabled = false,
  prefix
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options into SelectOption objects
  const normalizedOptions: SelectOption<T>[] = options.map(opt => {
    if (typeof opt === 'string') {
      return { value: opt, label: opt };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl
          bg-white border border-[#D2DFE2] text-xs font-semibold text-[#10222B]
          hover:border-[#1B8585]/60 focus:outline-none focus:ring-2 focus:ring-[#1B8585]/20
          transition-all cursor-pointer shadow-2xs select-none disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'border-[#1B8585] ring-2 ring-[#1B8585]/20 shadow-warm-sm' : ''}
          ${buttonClassName}
        `}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {prefix && <span className="shrink-0 text-stone-400">{prefix}</span>}
          {selectedOption?.icon && <span className="shrink-0">{selectedOption.icon}</span>}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown 
          className={`w-3.5 h-3.5 text-stone-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[#1B8585]' : ''
          }`} 
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-1.5 min-w-[180px] w-full bg-white rounded-2xl border border-[#D2DFE2]
            shadow-warm-xl py-1.5 max-h-60 overflow-y-auto scrollbar-none animate-in fade-in zoom-in-95 duration-150
            ${menuClassName}
          `}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3.5 py-2 text-left text-xs font-semibold flex items-center justify-between gap-2
                  transition-colors cursor-pointer rounded-xl
                  ${isSelected
                    ? 'bg-[#EBF7F7] text-[#146868] font-bold'
                    : 'text-stone-700 hover:bg-[#F2F6F7] hover:text-[#10222B]'
                  }
                `}
                style={{ width: 'calc(100% - 8px)', margin: '2px 4px' }}
              >
                <div className="flex items-center gap-2 min-w-0 truncate">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="truncate">
                    <div className="truncate">{opt.label}</div>
                    {opt.sublabel && (
                      <div className="text-[10px] font-normal text-stone-400 truncate">
                        {opt.sublabel}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#1B8585] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
