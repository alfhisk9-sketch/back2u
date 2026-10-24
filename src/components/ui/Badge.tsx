import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ItemStatus, ItemReportType } from '../../types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'lost' | 'found' | 'status' | 'score' | 'outline';
  status?: ItemStatus;
  reportType?: ItemReportType;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  status,
  reportType,
  size = 'md',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center font-medium rounded-full transition-colors select-none';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs tracking-tight',
  };

  let colorClasses = 'bg-[#E7EFEA] text-[#12241E]';

  if (reportType === 'lost') {
    colorClasses = 'bg-rose-50 text-rose-700 border border-rose-200/80';
  } else if (reportType === 'found') {
    colorClasses = 'bg-emerald-50 text-emerald-800 border border-emerald-200/80';
  } else if (status) {
    switch (status) {
      case 'open':
        colorClasses = 'bg-sky-50 text-sky-800 border border-sky-200';
        break;
      case 'matching':
        colorClasses = 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse';
        break;
      case 'claimed':
        colorClasses = 'bg-purple-50 text-purple-800 border border-purple-200';
        break;
      case 'resolved':
        colorClasses = 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold';
        break;
      case 'closed':
        colorClasses = 'bg-neutral-100 text-neutral-600 border border-neutral-200';
        break;
    }
  } else if (variant === 'score') {
    colorClasses = 'bg-emerald-600 text-white font-bold shadow-2xs';
  } else if (variant === 'outline') {
    colorClasses = 'bg-transparent border border-[#CBD5CE] text-[#536B63]';
  }

  return (
    <span
      className={twMerge(clsx(base, sizeClasses[size], colorClasses, className))}
      {...props}
    >
      {reportType && (
        <span
          className={clsx('w-1.5 h-1.5 rounded-full mr-1.5', {
            'bg-rose-500': reportType === 'lost',
            'bg-emerald-500': reportType === 'found',
          })}
        />
      )}
      {children ||
        (reportType ? (reportType === 'lost' ? 'Lost Item' : 'Found Item') : status)}
    </span>
  );
};
