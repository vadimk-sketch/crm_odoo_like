import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Handshake,
  Ticket,
  Clock,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';
import { Badge } from '@/components/common';
import { getContacts } from '@/api/contacts';
import { getDeals, getDealSummary, getPipelines } from '@/api/crm';
import { getTickets } from '@/api/helpdesk';

const priorityVariant: Record<string, 'default' | 'info' | 'warning' | 'danger'> = {
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

// Skeleton block for loading states
function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded bg-gray-200', className)} />;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
  loading?: boolean;
}

function StatCard({ icon, label, value, subtitle, color, loading }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', color)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-gray-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-20" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          )}
          {subtitle && !loading && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  // Data fetching
  const { data: contactsData, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', { page_size: 1 }],
    queryFn: () => getContacts({ page_size: 1 }),
  });

  const { data: dealSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['deal-summary'],
    queryFn: () => getDealSummary(),
  });

  const { data: openTicketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['tickets', { status: 'open', page_size: 1 }],
    queryFn: () => getTickets({ status: 'open', page_size: 1 }),
  });

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines'],
    queryFn: getPipelines,
  });

  const { data: openDealsData, isLoading: openDealsLoading } = useQuery({
    queryKey: ['deals', { page_size: 200 }],
    queryFn: () => getDeals({ page_size: 200 }),
  });

  const { data: myTicketsData, isLoading: myTicketsLoading } = useQuery({
    queryKey: ['tickets', { status: 'open', page_size: 5 }],
    queryFn: () => getTickets({ status: 'open', page_size: 5, ordering: '-priority' }),
  });

  // Build pipeline stage value summary from deals
  const pipelineStages = (() => {
    if (!pipelines.length || !openDealsData) return [];
    const defaultPipeline = pipelines.find((p) => p.is_default) || pipelines[0];
    if (!defaultPipeline) return [];

    const sorted = [...defaultPipeline.stages].sort((a, b) => a.order - b.order);
    const deals = openDealsData.results.filter(
      (d) => d.pipeline === defaultPipeline.id && !d.is_lost,
    );

    return sorted.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage.id);
      const totalValue = stageDeals.reduce(
        (sum, d) => sum + (parseFloat(d.expected_revenue) || 0),
        0,
      );
      return { name: stage.name, value: totalValue, count: stageDeals.length };
    });
  })();

  const maxStageValue = Math.max(...pipelineStages.map((s) => s.value), 1);

  // Top deals by amount
  const topDeals = openDealsData
    ? [...openDealsData.results]
        .filter((d) => !d.is_won && !d.is_lost)
        .sort((a, b) => parseFloat(b.expected_revenue) - parseFloat(a.expected_revenue))
        .slice(0, 5)
    : [];

  const topTickets = myTicketsData?.results?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          label="Total Contacts"
          value={contactsData?.count ?? 0}
          color="bg-blue-50"
          loading={contactsLoading}
        />
        <StatCard
          icon={<Handshake className="h-5 w-5 text-green-600" />}
          label="Open Deals"
          value={dealSummary?.total_deals ?? 0}
          subtitle={dealSummary ? `${formatCurrency(dealSummary.total_value)} total value` : undefined}
          color="bg-green-50"
          loading={summaryLoading}
        />
        <StatCard
          icon={<Ticket className="h-5 w-5 text-orange-600" />}
          label="Open Tickets"
          value={openTicketsData?.count ?? 0}
          color="bg-orange-50"
          loading={ticketsLoading}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-red-600" />}
          label="Conversion Rate"
          value={dealSummary ? `${dealSummary.conversion_rate}%` : '0%'}
          color="bg-red-50"
          loading={summaryLoading}
        />
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pipeline Summary */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Pipeline Summary</h2>
            <button
              onClick={() => navigate('/crm/pipeline')}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              View Pipeline <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {openDealsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : pipelineStages.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No pipeline data available</p>
          ) : (
            <div className="space-y-3">
              {pipelineStages.map((stage) => (
                <div key={stage.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-gray-600">
                    {stage.name}
                  </span>
                  <div className="flex-1">
                    <div className="h-7 rounded-md bg-gray-100 overflow-hidden">
                      <div
                        className="flex h-full items-center rounded-md bg-primary-500 px-2 transition-all"
                        style={{
                          width: `${Math.max((stage.value / maxStageValue) * 100, stage.value > 0 ? 8 : 0)}%`,
                        }}
                      >
                        {stage.value > 0 && (
                          <span className="text-xs font-medium text-white whitespace-nowrap">
                            {formatCurrency(stage.value)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="w-10 text-right text-xs text-gray-500">
                    {stage.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats / Recent */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Stats</h2>
          {summaryLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : (
            <dl className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Won Value</dt>
                <dd className="font-medium text-green-600">
                  {formatCurrency(dealSummary?.won_value ?? 0)}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Lost Value</dt>
                <dd className="font-medium text-red-600">
                  {formatCurrency(dealSummary?.lost_value ?? 0)}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Avg Deal Value</dt>
                <dd className="font-medium text-gray-900">
                  {formatCurrency(dealSummary?.avg_deal_value ?? 0)}
                </dd>
              </div>
              <div className="flex items-center justify-between text-sm">
                <dt className="text-gray-500">Conversion Rate</dt>
                <dd className="font-medium text-gray-900">
                  {dealSummary?.conversion_rate ?? 0}%
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      {/* Third row: tables */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Open Deals */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <h2 className="text-base font-semibold text-gray-900">Top Open Deals</h2>
            <button
              onClick={() => navigate('/crm/deals')}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {openDealsLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : topDeals.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No open deals</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-2 text-left text-xs font-semibold uppercase text-gray-500">Deal</th>
                  <th className="px-5 py-2 text-left text-xs font-semibold uppercase text-gray-500">Stage</th>
                  <th className="px-5 py-2 text-right text-xs font-semibold uppercase text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/crm/deals/${deal.id}`)}
                  >
                    <td className="whitespace-nowrap px-5 py-2.5 text-sm font-medium text-gray-900">
                      {deal.name}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5">
                      <Badge size="sm" variant="info">{deal.stage_name}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(deal.expected_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Assigned Tickets */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
            <h2 className="text-base font-semibold text-gray-900">Open Tickets</h2>
            <button
              onClick={() => navigate('/helpdesk/tickets')}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              View All <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {myTicketsLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : topTickets.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No open tickets</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-2 text-left text-xs font-semibold uppercase text-gray-500">Ticket</th>
                  <th className="px-5 py-2 text-left text-xs font-semibold uppercase text-gray-500">Priority</th>
                  <th className="px-5 py-2 text-left text-xs font-semibold uppercase text-gray-500">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => navigate(`/helpdesk/tickets/${ticket.id}`)}
                  >
                    <td className="whitespace-nowrap px-5 py-2.5">
                      <div>
                        <span className="text-xs text-gray-500 font-mono">
                          HD-{String(ticket.id).padStart(4, '0')}
                        </span>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {ticket.subject}
                        </p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5">
                      <Badge size="sm" variant={priorityVariant[ticket.priority]}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-sm text-gray-600">
                      {ticket.team_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
