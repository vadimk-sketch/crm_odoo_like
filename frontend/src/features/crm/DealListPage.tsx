import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Kanban, Trash2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Button,
  SearchInput,
  Table,
  Pagination,
  Modal,
  ConfirmDialog,
  Badge,
  EmptyState,
} from '@/components/common';
import type { Column } from '@/components/common';
import { getDeals, getPipelines, createDeal, deleteDeal } from '@/api/crm';
import { usePagination } from '@/hooks/usePagination';
import { DealForm } from './components/DealForm';
import type { Deal } from '@/types/crm';

const priorityVariant: Record<Deal['priority'], 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
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

export default function DealListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { page, pageSize, setPage } = usePagination();

  const [search, setSearch] = useState('');
  const [filterPipeline, setFilterPipeline] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Deal | null>(null);

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines'],
    queryFn: getPipelines,
  });

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, string | number> = { page, page_size: pageSize };
    if (search) params.search = search;
    if (filterPipeline) params.pipeline = filterPipeline;
    if (filterPriority) params.priority = filterPriority;
    return params;
  }, [page, pageSize, search, filterPipeline, filterPriority]);

  const { data, isLoading } = useQuery({
    queryKey: ['deals', queryParams],
    queryFn: () => getDeals(queryParams),
  });

  // Build stages lookup
  const stagesMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of pipelines) {
      for (const s of p.stages) {
        map.set(s.id, s.name);
      }
    }
    return map;
  }, [pipelines]);

  const createMutation = useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal created');
      setShowCreateModal(false);
    },
    onError: () => toast.error('Failed to create deal'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal deleted');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete deal'),
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

  const columns: Column<Deal>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (d) => (
        <span className="font-medium text-gray-900">{d.name}</span>
      ),
    },
    {
      key: 'company_name',
      header: 'Company',
      render: (d) =>
        d.company_name || <span className="text-gray-400">--</span>,
    },
    {
      key: 'stage_name',
      header: 'Stage',
      render: (d) => (
        <Badge size="sm" variant="info">
          {d.stage_name || stagesMap.get(d.stage) || '--'}
        </Badge>
      ),
    },
    {
      key: 'expected_revenue',
      header: 'Amount',
      sortable: true,
      render: (d) => (
        <span className="font-medium">{formatCurrency(d.expected_revenue)}</span>
      ),
    },
    {
      key: 'probability',
      header: 'Probability',
      sortable: true,
      render: (d) => `${d.probability}%`,
    },
    {
      key: 'assigned_to_name',
      header: 'Owner',
      render: (d) =>
        d.assigned_to_name || <span className="text-gray-400">--</span>,
    },
    {
      key: 'expected_closing',
      header: 'Expected Close',
      sortable: true,
      render: (d) =>
        d.expected_closing
          ? format(parseISO(d.expected_closing), 'MMM d, yyyy')
          : '--',
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (d) => (
        <Badge size="sm" variant={priorityVariant[d.priority]}>
          {d.priority}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (d) => format(parseISO(d.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      header: '',
      width: '40px',
      render: (d) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(d);
          }}
          className="rounded p-1 text-gray-400 hover:bg-danger-50 hover:text-danger-600"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Kanban className="h-4 w-4" />}
            onClick={() => navigate('/crm/pipeline')}
          >
            Pipeline View
          </Button>
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Deal
          </Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Search deals..."
          onChange={handleSearch}
          className="w-64"
        />
        <select
          className={selectClass}
          value={filterPipeline}
          onChange={(e) => {
            setFilterPipeline(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Pipelines</option>
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          className={selectClass}
          value={filterPriority}
          onChange={(e) => {
            setFilterPriority(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Table */}
      {!isLoading && data && data.results.length === 0 && !search && !filterPipeline && !filterPriority ? (
        <EmptyState
          title="No deals yet"
          description="Create your first deal to get started."
          actionLabel="Add Deal"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <Table<Deal>
          columns={columns}
          data={data?.results ?? []}
          loading={isLoading}
          onRowClick={(d) => navigate(`/crm/deals/${d.id}`)}
          emptyMessage="No deals match your filters"
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
        title="New Deal"
        size="lg"
      >
        <DealForm
          onSubmit={(d) => createMutation.mutate(d as Partial<Deal>)}
          onCancel={() => setShowCreateModal(false)}
          loading={createMutation.isPending}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Deal"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
