import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Kanban } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Button,
  SearchInput,
  Table,
  Pagination,
  Modal,
  Badge,
  EmptyState,
} from '@/components/common';
import type { Column } from '@/components/common';
import { getTickets, getTeams, createTicket } from '@/api/helpdesk';
import { usePagination } from '@/hooks/usePagination';
import { TicketForm } from './components/TicketForm';
import { SLABadge } from './components/SLABadge';
import type { Ticket } from '@/types/helpdesk';

const priorityVariant: Record<Ticket['priority'], 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
};

export default function TicketListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, pageSize, setPage } = usePagination();

  const [search, setSearch] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: getTeams,
  });

  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = { page, page_size: pageSize };
    if (search) params.search = search;
    if (filterTeam) params.team = filterTeam;
    if (filterPriority) params.priority = filterPriority;
    if (filterStatus) params.status = filterStatus;
    return params;
  }, [page, pageSize, search, filterTeam, filterPriority, filterStatus]);

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', queryParams],
    queryFn: () => getTickets(queryParams),
  });

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket created');
      setShowCreateModal(false);
    },
    onError: () => toast.error('Failed to create ticket'),
  });

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    [setPage],
  );

  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500';

  const columns: Column<Ticket>[] = [
    {
      key: 'id',
      header: 'Reference',
      width: '100px',
      render: (t) => (
        <span className="font-mono text-xs font-medium text-gray-600">
          HD-{String(t.id).padStart(4, '0')}
        </span>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      render: (t) => (
        <span className="font-medium text-gray-900">{t.subject}</span>
      ),
    },
    {
      key: 'team_name',
      header: 'Team',
      render: (t) => t.team_name || <span className="text-gray-400">--</span>,
    },
    {
      key: 'stage_name',
      header: 'Stage',
      render: (t) => (
        <Badge size="sm" variant="info">
          {t.stage_name}
        </Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => (
        <Badge size="sm" variant={priorityVariant[t.priority]}>
          {t.priority}
        </Badge>
      ),
    },
    {
      key: 'assigned_to_name',
      header: 'Assigned To',
      render: (t) =>
        t.assigned_to_name || <span className="text-gray-400">Unassigned</span>,
    },
    {
      key: 'sla',
      header: 'SLA',
      render: (t) => <SLABadge slaStatuses={t.sla_statuses} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (t) => format(parseISO(t.created_at), 'MMM d, yyyy'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Kanban className="h-4 w-4" />}
            onClick={() => navigate('/helpdesk/kanban')}
          >
            Kanban View
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            New Ticket
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Search tickets..."
          onChange={handleSearch}
          className="w-64"
        />
        <select
          className={selectClass}
          value={filterTeam}
          onChange={(e) => { setFilterTeam(e.target.value); setPage(1); }}
        >
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          className={selectClass}
          value={filterPriority}
          onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
        <select
          className={selectClass}
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      {!isLoading && data && data.results.length === 0 && !search && !filterTeam && !filterPriority && !filterStatus ? (
        <EmptyState
          title="No tickets yet"
          description="Create your first support ticket to get started."
          actionLabel="New Ticket"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <Table<Ticket>
          columns={columns}
          data={data?.results ?? []}
          loading={isLoading}
          onRowClick={(t) => navigate(`/helpdesk/tickets/${t.id}`)}
          emptyMessage="No tickets match your filters"
        />
      )}

      {/* Pagination */}
      {data && data.count > pageSize && (
        <Pagination
          page={page}
          totalCount={data.count}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Ticket"
        size="lg"
      >
        <TicketForm
          onSubmit={(d) => createMutation.mutate(d as Partial<Ticket>)}
          onCancel={() => setShowCreateModal(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}
