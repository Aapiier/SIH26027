import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top'
}) => {
  const [visible, setVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children || (
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-full"
          aria-label="Information"
        >
          <Info className="w-3.5 h-3.5" />
        </button>
      )}

      {visible && (
        <div
          role="tooltip"
          className={`absolute z-50 w-64 p-2.5 bg-slate-900 text-white text-xs rounded-md shadow-lg border border-slate-700 leading-relaxed pointer-events-none animate-fadeIn ${positionClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
