import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "bg-gray-50 text-gray-600 ring-gray-500/10",
        success: "bg-green-50 text-green-700 ring-green-600/20",
        warning: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
        error: "bg-red-50 text-red-700 ring-red-600/10",
        info: "bg-blue-50 text-blue-700 ring-blue-700/10",
        pending: "bg-orange-50 text-orange-700 ring-orange-600/20",
        active: "bg-green-50 text-green-700 ring-green-600/20",
        inactive: "bg-gray-50 text-gray-600 ring-gray-500/10",
        cancelled: "bg-red-50 text-red-700 ring-red-600/10",
        approved: "bg-green-50 text-green-700 ring-green-600/20",
        rejected: "bg-red-50 text-red-700 ring-red-600/10",
        draft: "bg-gray-50 text-gray-600 ring-gray-500/10",
        shipped: "bg-blue-50 text-blue-700 ring-blue-700/10",
        delivered: "bg-green-50 text-green-700 ring-green-600/20",
        overdue: "bg-red-50 text-red-700 ring-red-600/10",
        paid: "bg-green-50 text-green-700 ring-green-600/20",
        urgent: "bg-red-100 text-red-800 ring-red-600/20 animate-pulse",
        high: "bg-orange-50 text-orange-700 ring-orange-600/20",
        medium: "bg-yellow-50 text-yellow-800 ring-yellow-600/20",
        low: "bg-blue-50 text-blue-700 ring-blue-700/10"
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  status?: string;
  withDot?: boolean;
}

// Predefined status mappings for common use cases
const statusMappings: Record<string, VariantProps<typeof badgeVariants>['variant']> = {
  // General statuses
  'active': 'active',
  'inactive': 'inactive',
  'pending': 'pending',
  'cancelled': 'cancelled',
  'completed': 'success',
  'failed': 'error',
  
  // Order statuses
  'draft': 'draft',
  'pending_approval': 'pending',
  'approved': 'approved',
  'rejected': 'rejected',
  'in_progress': 'info',
  'shipped': 'shipped',
  'delivered': 'delivered',
  
  // Payment statuses
  'paid': 'paid',
  'unpaid': 'warning',
  'overdue': 'overdue',
  'partial_paid': 'warning',
  
  // Priority levels
  'urgent': 'urgent',
  'high': 'high',
  'medium': 'medium',
  'low': 'low',
  
  // Compliance statuses
  'compliant': 'success',
  'non_compliant': 'error',
  'under_review': 'warning',
  
  // Stock statuses
  'in_stock': 'success',
  'low_stock': 'warning',
  'out_of_stock': 'error',
  'reserved': 'info'
};

export function StatusBadge({ 
  className, 
  variant, 
  size,
  status,
  withDot = false,
  children,
  ...props 
}: StatusBadgeProps) {
  // Auto-map status to variant if not explicitly provided
  const finalVariant = variant || (status ? statusMappings[status.toLowerCase()] : 'default') || 'default';
  
  const displayText = children || (status ? status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '');

  return (
    <span 
      className={cn(badgeVariants({ variant: finalVariant, size }), className)} 
      {...props}
    >
      {withDot && (
        <span 
          className={cn(
            "mr-1.5 h-1.5 w-1.5 rounded-full",
            {
              'bg-gray-400': finalVariant === 'default' || finalVariant === 'inactive' || finalVariant === 'draft',
              'bg-green-500': finalVariant === 'success' || finalVariant === 'active' || finalVariant === 'approved' || finalVariant === 'paid' || finalVariant === 'delivered',
              'bg-yellow-500': finalVariant === 'warning' || finalVariant === 'pending' || finalVariant === 'medium',
              'bg-red-500': finalVariant === 'error' || finalVariant === 'cancelled' || finalVariant === 'rejected' || finalVariant === 'overdue' || finalVariant === 'urgent',
              'bg-blue-500': finalVariant === 'info' || finalVariant === 'shipped' || finalVariant === 'low',
              'bg-orange-500': finalVariant === 'high'
            }
          )}
        />
      )}
      {displayText}
    </span>
  );
}

// Convenience components for common statuses
export function OrderStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'variant'> & { status: string }) {
  return <StatusBadge status={status} withDot {...props} />;
}

export function PaymentStatusBadge({ status, ...props }: Omit<StatusBadgeProps, 'variant'> & { status: string }) {
  return <StatusBadge status={status} withDot {...props} />;
}

export function PriorityBadge({ priority, ...props }: Omit<StatusBadgeProps, 'variant'> & { priority: string }) {
  return <StatusBadge status={priority} {...props} />;
}

export function ComplianceBadge({ status, ...props }: Omit<StatusBadgeProps, 'variant'> & { status: string }) {
  return <StatusBadge status={status} withDot {...props} />;
}

export default StatusBadge;

