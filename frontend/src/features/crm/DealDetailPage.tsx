import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Building2,
  User,
  Calendar,
  Tag,
  Trophy,
  XCircle,
  ArrowRightLeft,
  DollarSign,
  Percent,
  Clock,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Button,
  Badge,
  LoadingSpinner,
  Modal,
  ConfirmDialog,
} from '@/components/common';
import {
  getDeal,
  updateDeal,
  deleteDeal,
  moveDeal,
  getPipeline,
} from '@/api/crm';
import { DealForm, type DealFormData } from './components/DealForm';
import type { Deal } from '@/types/crm';
import client from '@/api/client';
import type { DealActivity } from '@/types/crm';

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

const activityIcons: Record<string, typeof ArrowRightLeft> = {
  call: Clock,
  email: Clock,
  meeting: Calendar,
  task: Clock,
  note: Clock,
};

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const dealId = Number(id);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => getDeal(dealId),
    enabled: !!id,
  });

  const { data: pipeline } = useQuery({
    queryKey: ['pipeline', deal?.pipeline],
    queryFn: () => getPipeline(deal!.pipeline),
    enabled: !!deal?.pipeline,
  });

  const { data: activities = [] } = useQuery<DealActivity[]>({
    queryKey: ['deal', dealId, 'activities'],
    queryFn: async () => {
      const { data } = await client.get(`/crm/deals/${dealId}/activities/`);
      return data.results ?? data;
    },
    enabled: !!id,
  });

  const stages = useMemo(() => {
    if (!pipeline) return [];
    return [...pipeline.stages].sort((a, b) => a.order - b.order);
  }, [pipeline]);

  const currentStage = stages.find((s) => s.id === deal?.stage);

  const updateMutation = useMutation({
    mutationFn: (data: DealFormData) => updateDeal(dealId, data as Partial<Deal>),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal updated');
      setShowEditModal(false);
    },
    onError: () => toast.error('Failed to update deal'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteDeal(dealId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      toast.success('Deal deleted');
      navigate('/crm/deals');
    },
    onError: () => toast.error('Failed to delete deal'),
  });

  const moveMutation = useMutation({
    mutationFn: (stageId: number) => moveDeal(dealId, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deal', dealId, 'activities'] });
      toast.success('Deal moved');
    },
    onError: () => toast.error('Failed to move deal'),
  });

  const handleMarkWon = () => {
    const wonStage = stages.find((s) => s.is_won);
    if (wonStage) moveMutation.mutate(wonStage.id);
    else toast.error('No "Won" stage configured');
  };

  const handleMarkLost = () => {
    const lostStage = stages.find((s) => s.fold);
    if (lostStage) moveMutation.mutate(lostStage.id);
    else toast.error('No "Lost" stage configured');
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="py-12 text-center text-gray-500">Deal not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          to="/crm/deals"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Deals
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{deal.name}</h1>
            <Badge variant={deal.is_won ? 'success' : deal.is_lost ? 'danger' : 'info'} size="md">
              {deal.stage_name || currentStage?.name || '--'}
            </Badge>
            <Badge variant={priorityVariant[deal.priority]} size="sm">
              {deal.priority}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Pencil className="h-3.5 w-3.5" />}
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          icon={<DollarSign className="h-5 w-5 text-success-600" />}
          label="Amount"
          value={formatCurrency(deal.expected_revenue)}
        />
        <MetricCard
          icon={<Percent className="h-5 w-5 text-primary-600" />}
          label="Probability"
          value={`${deal.probability}%`}
        />
        <MetricCard
          icon={<Calendar className="h-5 w-5 text-warning-600" />}
          label="Expected Close"
          value={deal.expected_closing ? format(parseISO(deal.expected_closing), 'MMM d, yyyy') : '--'}
        />
        <MetricCard
          icon={<ArrowRightLeft className="h-5 w-5 text-gray-500" />}
          label="Stage"
          value={deal.stage_name || currentStage?.name || '--'}
        />
      </div>

      {/* Stage progress + Quick actions */}
      {stages.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Pipeline Progress</h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Trophy className="h-3.5 w-3.5 text-success-600" />}
                onClick={handleMarkWon}
                disabled={deal.is_won || moveMutation.isPending}
              >
                Won
              </Button>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<XCircle className="h-3.5 w-3.5 text-danger-600" />}
                onClick={handleMarkLost}
                disabled={deal.is_lost || moveMutation.isPending}
              >
                Lost
              </Button>
            </div>
          </div>
          <div className="flex gap-1">
            {stages.map((stage) => {
              const isActive = stage.id === deal.stage;
              const isPast =
                stage.order < (currentStage?.order ?? 0);
              return (
                <button
                  key={stage.id}
                  onClick={() => !isActive && moveMutation.mutate(stage.id)}
                  disabled={isActive || moveMutation.isPending}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? stage.is_won
                        ? 'bg-success-500 text-white'
                        : stage.fold
                          ? 'bg-danger-500 text-white'
                          : 'bg-primary-600 text-white'
                      : isPast
                        ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  } disabled:cursor-default`}
                  title={`Move to ${stage.name}`}
                >
                  {stage.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Description */}
          {deal.notes && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{deal.notes}</p>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Activity</h2>
            {activities.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">No activity yet.</p>
            ) : (
              <div className="relative space-y-0">
                <div className="absolute left-5 top-2 bottom-2 w-px bg-gray-200" />
                {activities.map((activity) => {
                  const Icon = activityIcons[activity.activity_type] ?? Clock;
                  return (
                    <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
                      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm text-gray-800">{activity.summary}</p>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          {activity.activity_type}
                        </span>
                        {activity.due_date && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            Due: {format(parseISO(activity.due_date), 'MMM d, yyyy')}
                          </p>
                        )}
                        <p className="mt-0.5 text-xs text-gray-400">
                          {format(parseISO(activity.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar (1/3) */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <User className="h-4 w-4" /> Contact
            </h3>
            {deal.contact ? (
              <Link
                to={`/contacts/${deal.contact}`}
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                {deal.contact_name || `Contact #${deal.contact}`}
              </Link>
            ) : (
              <p className="text-sm text-gray-400">No contact</p>
            )}
          </div>

          {/* Company */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Building2 className="h-4 w-4" /> Company
            </h3>
            {deal.company ? (
              <Link
                to={`/companies/${deal.company}`}
                className="text-sm font-medium text-primary-600 hover:underline"
              >
                {deal.company_name || `Company #${deal.company}`}
              </Link>
            ) : (
              <p className="text-sm text-gray-400">No company</p>
            )}
          </div>

          {/* Owner */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <User className="h-4 w-4" /> Owner
            </h3>
            <p className="text-sm text-gray-700">
              {deal.assigned_to_name || '--'}
            </p>
          </div>

          {/* Tags placeholder */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Tag className="h-4 w-4" /> Tags
            </h3>
            <p className="text-sm text-gray-400">No tags</p>
          </div>

          {/* Dates */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-500">
              <Calendar className="h-4 w-4" /> Dates
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-gray-700">
                  {format(parseISO(deal.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Updated</span>
                <span className="text-gray-700">
                  {format(parseISO(deal.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
              {deal.expected_closing && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Expected Close</span>
                  <span className="text-gray-700">
                    {format(parseISO(deal.expected_closing), 'MMM d, yyyy')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Deal"
        size="lg"
      >
        <DealForm
          deal={deal}
          onSubmit={(d) => updateMutation.mutate(d)}
          onCancel={() => setShowEditModal(false)}
          loading={updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Deal"
        message={`Are you sure you want to delete "${deal.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
