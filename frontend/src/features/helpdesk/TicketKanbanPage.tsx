import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, LoadingSpinner } from '@/components/common';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import type { KanbanColumn_ } from '@/components/kanban/KanbanBoard';
import { getTeams, getTickets, moveTicket } from '@/api/helpdesk';
import { TicketCard } from './components/TicketCard';
import type { Ticket } from '@/types/helpdesk';

export default function TicketKanbanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
  });

  // Auto-select first team
  const activeTeamId = selectedTeamId ?? teams[0]?.id ?? null;

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets', { team: activeTeamId, page_size: 200 }],
    queryFn: () => getTickets({ team: activeTeamId!, page_size: 200 }),
    enabled: !!activeTeamId,
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, stageId }: { id: number; stageId: number }) =>
      moveTicket(id, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: () => toast.error('Failed to move ticket'),
  });

  const selectedTeam = useMemo(
    () => teams.find((t) => t.id === activeTeamId),
    [teams, activeTeamId],
  );

  const columns: KanbanColumn_[] = useMemo(() => {
    if (!selectedTeam) return [];
    const tickets = ticketsData?.results ?? [];

    const sorted = [...selectedTeam.stages].sort((a, b) => a.order - b.order);
    return sorted.map((stage) => ({
      id: String(stage.id),
      title: stage.name,
      items: tickets.filter((t) => t.stage === stage.id),
    }));
  }, [selectedTeam, ticketsData]);

  const handleDragEnd = useCallback(
    (itemId: string, _fromColumnId: string, toColumnId: string) => {
      moveMutation.mutate({ id: Number(itemId), stageId: Number(toColumnId) });
    },
    [moveMutation],
  );

  const handleCardClick = useCallback(
    (ticket: Ticket) => navigate(`/helpdesk/tickets/${ticket.id}`),
    [navigate],
  );

  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  if (teamsLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ticket Board</h1>
        <div className="flex items-center gap-3">
          <select
            className={selectClass}
            value={activeTeamId ?? ''}
            onChange={(e) => setSelectedTeamId(Number(e.target.value))}
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<List className="h-4 w-4" />}
            onClick={() => navigate('/helpdesk/tickets')}
          >
            List View
          </Button>
        </div>
      </div>

      {/* Board */}
      {ticketsLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <KanbanBoard
          columns={columns}
          renderCard={(ticket: Ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={handleCardClick}
            />
          )}
          renderDragOverlay={(ticket: Ticket) => (
            <TicketCard ticket={ticket} isDragOverlay />
          )}
          onDragEnd={handleDragEnd}
          getItemId={(ticket: Ticket) => String(ticket.id)}
        />
      )}
    </div>
  );
}
