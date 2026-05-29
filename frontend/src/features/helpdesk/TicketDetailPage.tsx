import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Badge, LoadingSpinner } from '@/components/common';
import {
  getTicket,
  getTicketMessages,
  getTeams,
  updateTicket,
  moveTicket,
} from '@/api/helpdesk';
import { SLABadge } from './components/SLABadge';
import { MessageThread } from './components/MessageThread';
import type { Ticket } from '@/types/helpdesk';

const priorityVariant: Record<Ticket['priority'], 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
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

function SLADeadlineDisplay({ deadline }: { deadline: string }) {
  const d = new Date(deadline);
  const now = new Date();
  const isPast = d < now;
  return (
    <span className={isPast ? 'text-danger-600 font-medium' : 'text-gray-700'}>
      {format(parseISO(deadline), 'MMM d, yyyy h:mm a')}
      <span className="ml-1 text-xs text-gray-500">
        ({isPast ? 'overdue' : formatDistanceToNow(d, { addSuffix: true })})
      </span>
    </span>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ticketId = Number(id);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => getTicket(ticketId),
    enabled: !!ticketId,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: () => getTicketMessages(ticketId),
    enabled: !!ticketId,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
  });

  const currentTeam = useMemo(
    () => teams.find((t) => t.id === ticket?.team),
    [teams, ticket],
  );

  const stages = useMemo(
    () => currentTeam ? [...currentTeam.stages].sort((a, b) => a.order - b.order) : [],
    [currentTeam],
  );

  const moveMutation = useMutation({
    mutationFn: (stageId: number) => moveTicket(ticketId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Stage updated');
    },
    onError: () => toast.error('Failed to update stage'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Ticket>) => updateTicket(ticketId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Ticket updated');
    },
    onError: () => toast.error('Failed to update ticket'),
  });

  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  if (isLoading || !ticket) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const firstSlaDeadline = ticket.sla_statuses?.find((s) => !s.reached && s.deadline)?.deadline;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/helpdesk/tickets')}
          className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Tickets
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-gray-500">
                HD-{String(ticket.id).padStart(4, '0')}
              </span>
              <Badge variant={priorityVariant[ticket.priority]} size="sm">
                {ticket.priority}
              </Badge>
              <SLABadge slaStatuses={ticket.sla_statuses} />
            </div>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{ticket.subject}</h1>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex flex-wrap gap-6 rounded-lg border border-gray-200 bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <span className="text-gray-500">Team</span>
          <p className="font-medium text-gray-900">{ticket.team_name}</p>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Stage</span>
          <p className="font-medium text-gray-900">{ticket.stage_name}</p>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Assigned To</span>
          <p className="font-medium text-gray-900">
            {ticket.assigned_to_name || 'Unassigned'}
          </p>
        </div>
        <div className="text-sm">
          <span className="text-gray-500">Priority</span>
          <p className="font-medium text-gray-900 capitalize">{ticket.priority}</p>
        </div>
        {firstSlaDeadline && (
          <div className="text-sm">
            <span className="text-gray-500">SLA Deadline</span>
            <p><SLADeadlineDisplay deadline={firstSlaDeadline} /></p>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left - main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {ticket.description && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {/* Message Thread */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Conversation</h3>
            <MessageThread ticketId={ticketId} messages={messages} />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Contact card */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <User className="h-4 w-4 text-gray-400" />
              Contact
            </h3>
            {ticket.contact_name ? (
              <p className="text-sm text-gray-700">{ticket.contact_name}</p>
            ) : (
              <p className="text-sm text-gray-400">No contact assigned</p>
            )}
          </div>

          {/* Assigned To */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <User className="h-4 w-4 text-gray-400" />
              Assigned To
            </h3>
            {ticket.assigned_to_name ? (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                  {getInitials(ticket.assigned_to_name)}
                </span>
                <span className="text-sm text-gray-700">{ticket.assigned_to_name}</span>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Unassigned</p>
            )}
          </div>

          {/* Stage */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Stage</h3>
            <select
              className={selectClass + ' w-full'}
              value={ticket.stage}
              onChange={(e) => moveMutation.mutate(Number(e.target.value))}
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Priority</h3>
            <select
              className={selectClass + ' w-full'}
              value={ticket.priority}
              onChange={(e) =>
                updateMutation.mutate({ priority: e.target.value as Ticket['priority'] })
              }
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* SLA Info */}
          {ticket.sla_statuses && ticket.sla_statuses.length > 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <Clock className="h-4 w-4 text-gray-400" />
                SLA Policies
              </h3>
              <div className="space-y-2">
                {ticket.sla_statuses.map((sla) => (
                  <div key={sla.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{sla.policy.name}</span>
                    <Badge
                      size="sm"
                      variant={sla.failed ? 'danger' : sla.reached ? 'success' : 'warning'}
                    >
                      {sla.failed ? 'Failed' : sla.reached ? 'Met' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              Dates
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-700">
                  {format(parseISO(ticket.created_at), 'MMM d, yyyy')}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Updated</dt>
                <dd className="text-gray-700">
                  {format(parseISO(ticket.updated_at), 'MMM d, yyyy')}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
