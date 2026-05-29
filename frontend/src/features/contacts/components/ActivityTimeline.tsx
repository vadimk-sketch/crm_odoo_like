import { Phone, Mail, Calendar, CheckCircle2, StickyNote } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import clsx from 'clsx';
import type { Activity } from '@/types/contact';

const typeConfig: Record<Activity['activity_type'], { icon: typeof Phone; label: string }> = {
  call: { icon: Phone, label: 'Call' },
  email: { icon: Mail, label: 'Email' },
  meeting: { icon: Calendar, label: 'Meeting' },
  task: { icon: CheckCircle2, label: 'Task' },
  note: { icon: StickyNote, label: 'Note' },
};

function getStatusColor(activity: Activity): string {
  if (activity.done) return 'text-success-600 bg-success-50 border-success-200';
  if (activity.due_date && isPast(parseISO(activity.due_date))) {
    return 'text-danger-600 bg-danger-50 border-danger-200';
  }
  return 'text-primary-600 bg-primary-50 border-primary-200';
}

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">No activities yet.</p>
    );
  }

  return (
    <div className="relative space-y-0">
      {/* vertical line */}
      <div className="absolute left-5 top-2 bottom-2 w-px bg-gray-200" />

      {activities.map((activity) => {
        const config = typeConfig[activity.activity_type];
        const Icon = config.icon;
        const statusColor = getStatusColor(activity);

        return (
          <div key={activity.id} className="relative flex gap-4 pb-6 last:pb-0">
            <div
              className={clsx(
                'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border',
                statusColor,
              )}
            >
              <Icon className="h-4 w-4" />
            </div>

            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{activity.summary}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {config.label}
                </span>
                {activity.done && (
                  <span className="rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                    Done
                  </span>
                )}
                {!activity.done && activity.due_date && isPast(parseISO(activity.due_date)) && (
                  <span className="rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-700">
                    Overdue
                  </span>
                )}
              </div>
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
  );
}
