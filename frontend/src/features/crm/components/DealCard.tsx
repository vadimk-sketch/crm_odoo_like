import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, DollarSign } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import type { Deal } from '@/types/crm';

const priorityColors: Record<Deal['priority'], string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-400',
  high: 'bg-warning-500',
  urgent: 'bg-danger-500',
};

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface DealCardProps {
  deal: Deal;
  onClick?: (deal: Deal) => void;
  isDragOverlay?: boolean;
}

export function DealCard({ deal, onClick, isDragOverlay }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(deal.id) });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(deal)}
      className={clsx(
        'cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'opacity-40',
        isDragOverlay && 'rotate-2 shadow-lg ring-2 ring-primary-300',
      )}
    >
      {/* Title row */}
      <div className="flex items-start gap-2">
        <span
          className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', priorityColors[deal.priority])}
          title={`Priority: ${deal.priority}`}
        />
        <h4 className="min-w-0 flex-1 text-sm font-medium text-gray-900 line-clamp-2">
          {deal.name}
        </h4>
      </div>

      {/* Company */}
      {deal.company_name && (
        <p className="mt-1 truncate pl-4 text-xs text-gray-500">{deal.company_name}</p>
      )}

      {/* Bottom row: amount, date, owner */}
      <div className="mt-2.5 flex items-center justify-between pl-4">
        <span className="flex items-center gap-1 text-sm font-semibold text-gray-800">
          <DollarSign className="h-3.5 w-3.5 text-gray-400" />
          {formatCurrency(deal.expected_revenue)}
        </span>
        <div className="flex items-center gap-2">
          {deal.expected_closing && (
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400" title="Expected close">
              <Calendar className="h-3 w-3" />
              {format(parseISO(deal.expected_closing), 'MMM d')}
            </span>
          )}
          {deal.assigned_to_name && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700"
              title={deal.assigned_to_name}
            >
              {getInitials(deal.assigned_to_name)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
