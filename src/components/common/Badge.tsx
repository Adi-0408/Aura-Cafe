import React from 'react';
import { DietaryTag } from '../../types';
import { DIETARY_TAGS_META } from '../../services/mockData';

interface DietaryBadgeProps {
  tag: DietaryTag;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export const DietaryBadge: React.FC<DietaryBadgeProps> = ({ tag, size = 'sm', showLabel = false }) => {
  const meta = DIETARY_TAGS_META[tag] || {
    tag,
    label: tag,
    fullName: tag,
    colorClass: 'text-stone-700',
    bgClass: 'bg-stone-100',
    borderClass: 'border-stone-300',
    description: '',
  };

  const sizeClasses = size === 'sm' 
    ? 'text-[11px] px-1.5 py-0.5 font-medium' 
    : 'text-xs px-2 py-1 font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border ${meta.bgClass} ${meta.colorClass} ${meta.borderClass} ${sizeClasses} shadow-sm transition-all duration-150 cursor-help`}
      title={`${meta.fullName}: ${meta.description}`}
    >
      <span className="font-mono font-bold tracking-tight">{meta.tag}</span>
      {showLabel && <span className="opacity-90">{meta.label}</span>}
    </span>
  );
};

interface StockStatusBadgeProps {
  quantity: number;
  minThreshold: number;
  isArchived?: boolean;
  size?: 'sm' | 'md';
}

export const StockStatusBadge: React.FC<StockStatusBadgeProps> = ({
  quantity,
  minThreshold,
  isArchived = false,
  size = 'sm'
}) => {
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (isArchived) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-stone-100 text-stone-600 border border-stone-300 ${padding}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
        Archived
      </span>
    );
  }

  if (quantity <= 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${padding} animate-pulse`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
        Out of Stock
      </span>
    );
  }

  if (quantity <= minThreshold) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${padding}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        Low Stock ({quantity})
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${padding}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
      In Stock
    </span>
  );
};

export const LiveAvailabilityBadge: React.FC<{ isAvailable: boolean }> = ({ isAvailable }) => {
  if (!isAvailable) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
        Sold Out Today
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
      Available Fresh
    </span>
  );
};
