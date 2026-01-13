'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-destructive text-destructive-foreground',
        outline:
          'text-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-6 px-3 py-1',
        sm: 'h-5 px-2.5 py-0.5',
        lg: 'h-8 px-4 py-2',
      },
    },
  }
);

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size = 'default', children, ...props }, ref) => {
    const Comp = 'div';

    return (
      <Comp className={cn(badgeVariants({ variant, size, className }))} ref={ref} {...props}>
        {children}
      </Comp>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
