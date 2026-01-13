'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  showValue?: boolean;
  label?: string;
}

const progressVariants = cva('relative overflow-hidden rounded-full bg-gray-200', {
  variants: {
    variant: {
      default: 'bg-blue-500 text-white',
      success: 'bg-green-500 text-white',
      warning: 'bg-yellow-500 text-white',
      destructive: 'bg-red-500 text-white',
    },
    size: {
      sm: 'h-2',
      md: 'h-3',
      lg: 'h-4',
    },
  },
});

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      size = 'md',
      variant = 'default',
      showValue = false,
      label,
      ...props
    },
    ref
  ) => {
    const percentage = Math.round((value / max) * 100);

    return (
      <div className={cn(progressVariants({ variant, size, className }))} ref={ref} {...props}>
        <div className="relative w-full">
          <div
            className={cn('bg-blue-500 transition-all duration-300 ease-out', {
              'h-2': 'w-2',
              'h-3': 'w-3',
              'h-4': 'w-4',
            })}
            style={{
              width: `${percentage}%`,
            }}
          />
          {showValue && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white font-medium text-sm">{percentage}%</span>
            </div>
          )}
        </div>
        {label && (
          <div className="mt-2 text-center">
            <span className="text-sm font-medium text-gray-600">{label}</span>
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

export { Progress, progressVariants };
