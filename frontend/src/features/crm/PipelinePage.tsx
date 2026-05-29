import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, LayoutList, DollarSign, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, LoadingSpinner, Modal } from '@/components/common';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import type { KanbanColumn_ } from '@/components/kanban/KanbanBoard';
import { DealCard } from './components/DealCard';
import { DealForm, type DealFormData } from './components/DealForm';
import { getPipelines, getDeals, createDeal, moveDeal } from '@/api/crm';
import type { Deal, Stage } from '@/types/crm';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function stageValue(deals: Deal[]): number {
  return deals.reduce(
    (sum, d) => sum + (parseFloat(d.expected_revenue) || 0),
    0,
  );
}

function stageColor(stage: Stage): string | undefined {
  if (stage.is_won) return 'border-success-500 bg-success-50';
  if (stage.fold) return 'border-danger-500 bg-danger-50';
  return undefined;
}

export default function PipelinePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedPipelineId, setSelectedPipelineId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch all pipelines
  const { data: pipelines = [], isLoading: pipelinesLoading } = useQuery({
    queryKey: ['pipelines'],
    queryFn: getPipelines,
  });

  // Auto-select default pipeline
  const activePipelineId = useMemo(() => {
    if (selectedPipelineId && pipelines.some((p) => p.id === selectedPipelineId))
      return selectedPipelineId;
    const def = pipelines.find((p) => p.is_default) ?? pipelines[0];
    return def?.id ?? null;
  }, [pipelines, selectedPipelineId]);

  const activePipeline = pipelines.find((p) => p.id === activePipelineId);

  // Fetch deals for the active pipeline
  const { data: dealsData, isLoading: dealsLoading } = useQuery({
    queryKey: ['deals', { pipeline: activePipelineId, page_size: 500 }],
    queryFn: () => getDeals({ pipeline: activePipelineId!, page_size: 500 }),
    enabled: !!activePipelineId,
  });

  const allDeals = dealsData?.results ?? [];

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const map = new Map<number, Deal[]>();
    for (const deal of allDeals) {
      const list = map.get(deal.stage) ?? [];
      list.push(deal);
      map.set(deal.stage, list);
    }
    return map;
  }, [allDeals]);

  // Build kanban columns from pipeline stages
  const columns: KanbanColumn_[] = useMemo(() => {
    if (!activePipeline) return [];
    const sorted = [...activePipeline.stages].sort((a, b) => a.order - b.order);
    return sorted.map((stage) => {
      const items = dealsByStage.get(stage.id) ?? [];
      const value = stageValue(items);
      return {
        id: String(stage.id),
        title: stage.name,
        subtitle: `${formatCurrency(value)}`,
        color: stageColor(stage),
        items,
      };
    });
  }, [activePipeline, dealsByStage]);

  // Summary stats
  const totalDeals = allDeals.length;
  const totalValue = allDeals.reduce(
    (s, d) => s + (parseFloat(d.expected_revenue) || 0),
    0,
  );

  // Move deal mutation
  const moveMutation = useMutation({
    mutationFn: ({ dealId, stageId }: { dealId: number; stageId: number }) =>
      moveDeal(dealId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
    onError: () => toast.error('Failed to move deal'),
  });

  const handleDragEnd = useCallback(
    (itemId: string, _fromColumnId: string, toColumnId: string) => {
      moveMutation.mutate({ dealId: Number(itemId), stageId: Number(toColumnId) });
    },
    [moveMutation],
  );

  // Create deal
  const createMutation = useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['pipelines'] });
      toast.success('Deal created');
      setShowCreateModal(false);
    },
    onError: () => toast.error('Failed to create deal'),
  });

  const handleCreateSubmit = useCallback(
    (data: DealFormData) => {
      createMutation.mutate(data as Partial<Deal>);
    },
    [createMutation],
  );

  const handleCardClick = useCallback(
    (deal: Deal) => navigate(`/crm/deals/${deal.id}`),
    [navigate],
  );

  if (pipelinesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>

          {pipelines.length > 1 && (
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              value={activePipelineId ?? ''}
              onChange={(e) => setSelectedPipelineId(Number(e.target.value))}
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Summary stats */}
          <div className="hidden items-center gap-4 text-sm text-gray-500 sm:flex">
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              {totalDeals} deals
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {formatCurrency(totalValue)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<LayoutList className="h-4 w-4" />}
            onClick={() => navigate('/crm/deals')}
          >
            List View
          </Button>
          <Button
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Add Deal
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      {dealsLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <KanbanBoard
          columns={columns}
          getItemId={(deal: Deal) => String(deal.id)}
          renderCard={(deal: Deal) => (
            <DealCard key={deal.id} deal={deal} onClick={handleCardClick} />
          )}
          renderDragOverlay={(deal: Deal) => (
            <DealCard deal={deal} isDragOverlay />
          )}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* Create deal modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Deal"
        size="lg"
      >
        <DealForm
          defaultPipelineId={activePipelineId ?? undefined}
          defaultStageId={
            activePipeline?.stages
              ? [...activePipeline.stages].sort((a, b) => a.order - b.order)[0]?.id
              : undefined
          }
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowCreateModal(false)}
          loading={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}
