import React, { useState, useEffect, useRef } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface InlineStockEditorProps {
  itemId: string;
  value: number;
  unit?: string;
  isCurrency?: boolean;
  onSave: (id: string, newVal: number) => Promise<void>;
}

export const InlineStockEditor: React.FC<InlineStockEditorProps> = ({
  itemId,
  value,
  unit,
  isCurrency = false,
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentVal, setCurrentVal] = useState<string>(value.toString());
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentVal(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const num = parseFloat(currentVal);
    if (!isNaN(num) && num >= 0) {
      setIsSaving(true);
      await onSave(itemId, num);
      setIsSaving(false);
    } else {
      setCurrentVal(value.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setCurrentVal(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="inline-flex items-center gap-1 bg-white p-1 rounded-lg border border-[#1B8585] shadow-sm" onClick={(e) => e.stopPropagation()}>
        {isCurrency && <span className="text-xs font-semibold text-stone-500">₹</span>}
        <input
          ref={inputRef}
          type="number"
          step={isCurrency ? '1' : '0.1'}
          min="0"
          value={currentVal}
          onChange={(e) => setCurrentVal(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={isSaving}
          className="w-16 px-1.5 py-0.5 text-xs font-bold text-[#10222B] focus:outline-none bg-transparent"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1 rounded bg-[#10222B] text-[#77C7C6] hover:bg-[#1E3A47]"
          title="Save (Enter)"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={() => { setCurrentVal(value.toString()); setIsEditing(false); }}
          className="p-1 rounded text-stone-400 hover:text-stone-600"
          title="Cancel (Esc)"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
      }}
      className="group/inline inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#F2F6F7] border border-transparent hover:border-[#D2DFE2] transition-all cursor-pointer"
      title="Click to edit value inline"
    >
      <span className="font-bold text-xs text-[#10222B]">
        {isCurrency ? formatCurrency(value) : `${value} ${unit || ''}`}
      </span>
      <Edit2 className="w-3 h-3 text-stone-400 opacity-0 group-hover/inline:opacity-100 transition-opacity" />
    </div>
  );
};
