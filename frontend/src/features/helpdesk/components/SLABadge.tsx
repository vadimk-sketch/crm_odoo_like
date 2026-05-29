import { Badge } from '@/components/common';
import type { SLA } from '@/types/helpdesk';

interface SLABadgeProps {
  slaStatuses: SLA[];
  size?: 'sm' | 'md';
}

function getWorstStatus(slaStatuses: SLA[]): {
  variant: 'success' | 'warning' | 'danger' | 'default';
  label: string;
} {
  if (!slaStatuses || slaStatuses.length === 0) {
    return { variant: 'default', label: 'No SLA' };
  }

  let hasBreached = false;
  let hasAtRisk = false;

  for (const sla of slaStatuses) {
    if (sla.failed) {
      hasBreached = true;
      break;
    }
    if (!sla.reached && sla.deadline) {
      const deadline = new Date(sla.deadline);
      const now = new Date();
      const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursLeft <= 0) {
        hasBreached = true;
        break;
      }
      if (hoursLeft <= 1) {
        hasAtRisk = true;
      }
    }
  }

  if (hasBreached) return { variant: 'danger', label: 'Breached' };
  if (hasAtRisk) return { variant: 'warning', label: 'At Risk' };
  return { variant: 'success', label: 'On Track' };
}

export function SLABadge({ slaStatuses, size = 'sm' }: SLABadgeProps) {
  const { variant, label } = getWorstStatus(slaStatuses);
  return (
    <Badge variant={variant} size={size}>
      {label}
    </Badge>
  );
}
