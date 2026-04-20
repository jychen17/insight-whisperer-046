import { ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableItemProps {
  id: string;
  children: (handleProps: { listeners: any; attributes: any; isDragging: boolean }) => ReactNode;
}

export function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : "auto",
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ listeners, attributes, isDragging })}
    </div>
  );
}

interface SortableListProps<T extends { key: string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (
    item: T,
    index: number,
    handle: ReactNode,
  ) => ReactNode;
}

export function SortableList<T extends { key: string }>({
  items,
  onReorder,
  renderItem,
}: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.key === active.id);
    const newIndex = items.findIndex(i => i.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.key)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {items.map((item, idx) => (
            <SortableItem key={item.key} id={item.key}>
              {({ listeners, attributes, isDragging }) => {
                const handle = (
                  <button
                    {...attributes}
                    {...listeners}
                    className={`p-1 rounded cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground hover:bg-accent ${isDragging ? "cursor-grabbing" : ""}`}
                    title="拖动排序"
                    aria-label="拖动排序"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                  </button>
                );
                return <>{renderItem(item, idx, handle)}</>;
              }}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
