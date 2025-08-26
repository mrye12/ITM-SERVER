import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const cardVariants = cva(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200",
        elevated: "bg-white border-gray-200 shadow-md",
        outlined: "bg-white border-gray-300",
        filled: "bg-gray-50 border-gray-200",
        success: "bg-green-50 border-green-200",
        warning: "bg-yellow-50 border-yellow-200",
        error: "bg-red-50 border-red-200",
        info: "bg-blue-50 border-blue-200"
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground text-gray-600", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4 border-t border-gray-200", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Specialized card components for enterprise use
interface MetricCardProps extends Omit<CardProps, 'children'> {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
    period?: string;
  };
  icon?: React.ReactNode;
  trend?: React.ReactNode;
}

const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  ({ title, value, change, icon, trend, className, ...props }, ref) => (
    <Card ref={ref} className={cn("", className)} {...props}>
      <CardContent className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change && (
              <div className="flex items-center text-sm">
                <span
                  className={cn(
                    "flex items-center",
                    change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {change.type === 'increase' ? '↗' : '↘'} {Math.abs(change.value)}%
                </span>
                {change.period && (
                  <span className="text-gray-500 ml-1">{change.period}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4">
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  )
);
MetricCard.displayName = "MetricCard";

interface AlertCardProps extends Omit<CardProps, 'variant'> {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  description?: string;
  action?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const AlertCard = forwardRef<HTMLDivElement, AlertCardProps>(
  ({ type, title, description, action, dismissible, onDismiss, className, ...props }, ref) => {
    const variantMap = {
      info: 'info' as const,
      success: 'success' as const,
      warning: 'warning' as const,
      error: 'error' as const
    };

    return (
      <Card ref={ref} variant={variantMap[type]} className={cn("", className)} {...props}>
        <CardContent>
          <div className="flex">
            <div className="flex-1">
              <h4 className="text-sm font-medium">{title}</h4>
              {description && (
                <p className="text-sm text-gray-600 mt-1">{description}</p>
              )}
              {action && (
                <div className="mt-3">
                  {action}
                </div>
              )}
            </div>
            {dismissible && (
              <button
                onClick={onDismiss}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);
AlertCard.displayName = "AlertCard";

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  MetricCard,
  AlertCard
};

