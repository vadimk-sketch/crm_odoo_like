import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';

interface KanbanColumnProps {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
  count: number;
  itemIds: string[];
  children: React.ReactNode;
}

export function KanbanColumn({
  id,
  title,
  subtitle,
  color,
  count,
  itemIds,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={clsx(
        'flex w-72 shrink-0 flex-col rounded-lg bg-gray-50',
        isOver && 'ring-2 ring-primary-400 ring-offset-1',
      )}
    >
      {/* Column header */}
      <div
        className={clsx(
          'flex items-center justify-between rounded-t-lg border-b-2 px-3 py-2.5',
          color ?? 'border-gray-300 bg-gray-100',
        )}
      >
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-800">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <span className="ml-2 flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-600">
          {count}
        </span>
      </div>

      {/* Cards area */}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex flex-1 flex-col gap-2 overflow-y-auto p-2"
          style={{ minHeight: 80, maxHeight: 'calc(100vh - 220px)' }}
        >
          {children}
          {count === 0 && (
            <div className="flex flex-1 items-center justify-center rounded-md border-2 border-dashed border-gray-200 py-8 text-xs text-gray-400">
              Drop deals here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
