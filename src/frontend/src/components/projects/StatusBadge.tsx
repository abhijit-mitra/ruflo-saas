import { clsx } from 'clsx';

type StatusType =
  | 'draft'
  | 'active'
  | 'won'
  | 'lost'
  | 'completed'
  | 'submitted'
  | 'revised'
  | 'sent'
  | 'paid'
  | 'acknowledged'
  | 'received'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'pending'
  | 'approved'
  | 'rejected';

const statusStyles: Record<StatusType, string> = {
  draft: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  active: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  won: 'bg-green-500/20 text-green-400 border-green-500/30',
  lost: 'bg-red-500/20 text-red-400 border-red-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  revised: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sent: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  paid: 'bg-green-500/20 text-green-400 border-green-500/30',
  acknowledged: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  received: 'bg-green-500/20 text-green-400 border-green-500/30',
  confirmed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered: 'bg-green-500/20 text-green-400 border-green-500/30',
  pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const key = status as StatusType;
  const style = statusStyles[key] ?? statusStyles.draft;

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        style,
        className,
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
