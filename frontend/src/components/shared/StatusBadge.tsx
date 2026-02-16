import { cn } from '../../lib/utils';

type StatusVariant =
  | 'active'
  | 'approved'
  | 'pending'
  | 'uploaded'
  | 'rejected'
  | 'archived'
  | 'inactive'
  | 'assigned_to_sdr'
  | 'meeting_scheduled';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<StatusVariant, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  uploaded: 'bg-amber-50 text-amber-700 border-amber-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
  inactive: 'bg-slate-100 text-slate-600 border-slate-200',
  assigned_to_sdr: 'bg-blue-50 text-blue-700 border-blue-200',
  meeting_scheduled: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = status.toLowerCase() as StatusVariant;
  const style = statusStyles[variant] || 'bg-slate-100 text-slate-600 border-slate-200';

  const label = status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        style,
        className
      )}
    >
      {label}
    </span>
  );
}
