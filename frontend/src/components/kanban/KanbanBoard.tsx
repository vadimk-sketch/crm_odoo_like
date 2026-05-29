import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';

export interface KanbanColumn_ {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
  items: any[];
}

export interface KanbanBoardProps {
  columns: KanbanColumn_[];
  renderCard: (item: any) => React.ReactNode;
  renderDragOverlay?: (item: any) => React.ReactNode;
  onDragEnd: (itemId: string, fromColumnId: string, toColumnId: string) => void;
  getItemId: (item: any) => string;
  getItemColumnId?: (item: any) => string;
}

export function KanbanBoard({
  columns,
  renderCard,
  renderDragOverlay,
  onDragEnd,
  getItemId,
}: KanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<any>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const findColumnForItem = useCallback(
    (itemId: string): string | undefined => {
      for (const col of columns) {
        if (col.items.some((item) => getItemId(item) === itemId)) {
          return col.id;
        }
      }
      return undefined;
    },
    [columns, getItemId],
  );

  const findItem = useCallback(
    (itemId: string): any => {
      for (const col of columns) {
        const item = col.items.find((i) => getItemId(i) === itemId);
        if (item) return item;
      }
      return null;
    },
    [columns, getItemId],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const item = findItem(String(active.id));
      const colId = findColumnForItem(String(active.id));
      setActiveItem(item);
      setActiveColumnId(colId ?? null);
    },
    [findItem, findColumnForItem],
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Handled on drag end
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);

      if (!over || !activeColumnId) return;

      const itemId = String(active.id);
      const overId = String(over.id);

      // Determine the target column: either the column itself or the column that contains the over item
      let toColumnId = columns.find((c) => c.id === overId)?.id;
      if (!toColumnId) {
        toColumnId = findColumnForItem(overId);
      }

      if (!toColumnId || toColumnId === activeColumnId) {
        setActiveColumnId(null);
        return;
      }

      onDragEnd(itemId, activeColumnId, toColumnId);
      setActiveColumnId(null);
    },
    [activeColumnId, columns, findColumnForItem, onDragEnd],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const itemIds = column.items.map((item) => getItemId(item));
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              subtitle={column.subtitle}
              color={column.color}
              count={column.items.length}
              itemIds={itemIds}
            >
              {column.items.map((item) => renderCard(item))}
            </KanbanColumn>
          );
        })}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem
          ? (renderDragOverlay ?? renderCard)(activeItem)
          : null}
      </DragOverlay>
    </DndContext>
  );
}
