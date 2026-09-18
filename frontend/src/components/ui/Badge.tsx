import React from 'react';

export type BadgeVariant =
  | 'emergency'
  | 'critical'
  | 'warning'
  | 'success'
  | 'info'
  | 'neutral'
  | 'eng'
  | 'snt'
  | 'trd'
  | 'combined';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const variantClasses: Record<BadgeVariant, string> = {
    emergency: 'bg-red-50 text-red-700 border border-red-200 font-semibold',
    critical: 'bg-red-50 text-red-700 border border-red-200 font-medium',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200 font-medium',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium',
    info: 'bg-blue-50 text-blue-700 border border-blue-200 font-medium',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
    eng: 'bg-blue-50 text-blue-800 border border-blue-200 font-medium',
    snt: 'bg-amber-50 text-amber-900 border border-amber-200 font-medium',
    trd: 'bg-purple-50 text-purple-800 border border-purple-200 font-medium',
    combined: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md tracking-tight ${sizeClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
