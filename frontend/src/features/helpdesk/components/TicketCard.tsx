import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import type { Ticket } from '@/types/helpdesk';
import { SLABadge } from './SLABadge';

const priorityColors: Record<Ticket['priority'], string> = {
  low: 'bg-gray-400',
  medium: 'bg-blue-400',
  high: 'bg-warning-500',
  urgent: 'bg-danger-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  isDragOverlay?: boolean;
}

export function TicketCard({ ticket, onClick, isDragOverlay }: TicketCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: String(ticket.id) });

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
      onClick={() => onClick?.(ticket)}
      className={clsx(
        'cursor-pointer rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md',
        isDragging && 'opacity-40',
        isDragOverlay && 'rotate-2 shadow-lg ring-2 ring-primary-300',
      )}
    >
      {/* Reference + priority */}
      <div className="flex items-start gap-2">
        <span
          className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', priorityColors[ticket.priority])}
          title={`Priority: ${ticket.priority}`}
        />
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-gray-500">
            HD-{String(ticket.id).padStart(4, '0')}
          </span>
          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
            {ticket.subject}
          </h4>
        </div>
      </div>

      {/* Bottom row */}
      <div className="mt-2 flex items-center justify-between pl-4">
        <SLABadge slaStatuses={ticket.sla_statuses} />
        {ticket.assigned_to_name && (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700"
            title={ticket.assigned_to_name}
          >
            {getInitials(ticket.assigned_to_name)}
          </span>
        )}
      </div>
    </div>
  );
}
