import {
  closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";

/** Choose the column under the pointer before considering cards inside it. */
export const kanbanCollisionDetection: CollisionDetection = (args) => {
  const columns = args.droppableContainers.filter((container) => container.data.current?.kind === "column");
  const columnHits = args.pointerCoordinates
    ? pointerWithin({ ...args, droppableContainers: columns })
    : rectIntersection({ ...args, droppableContainers: columns });
  const column = columnHits[0];
  if (!column) return [];

  const cards = args.droppableContainers.filter((container) =>
    container.data.current?.kind === "ticket" && container.data.current.status === column.id,
  );
  if (!cards.length) return [column];

  if (args.pointerCoordinates) {
    const withPointer = (hits: ReturnType<CollisionDetection>) => hits.map((hit) => ({
      ...hit, data: { ...hit.data, pointerY: args.pointerCoordinates!.y },
    }));
    const hits = pointerWithin({ ...args, droppableContainers: cards });
    // Keep the active card here so releasing it in its original spot is a no-op.
    if (hits.length) return withPointer(hits);
    const otherCards = cards.filter((card) => card.id !== args.active.id);
    const bottoms = otherCards.flatMap((card) => {
      const rect = args.droppableRects.get(card.id);
      return rect ? [rect.bottom] : [];
    });
    if (!bottoms.length || args.pointerCoordinates.y > Math.max(...bottoms)) return [column];
    const { x, y } = args.pointerCoordinates;
    return withPointer(closestCenter({
      ...args,
      // Gaps between cards use pointer distance, independent of the drag handle offset.
      collisionRect: { left: x, right: x, top: y, bottom: y, width: 0, height: 0 },
      droppableContainers: otherCards,
    }));
  }

  return closestCenter({ ...args, droppableContainers: cards });
};

/** Use collision-time coordinates so auto-scroll and the handle offset cannot skew placement. */
export function dropIsAfterCard(event: DragEndEvent) {
  if (!event.over) return false;
  const pointerY = event.collisions?.[0]?.data?.pointerY;
  const translated = event.active.rect.current.translated;
  const y = typeof pointerY === "number" ? pointerY : (translated ? translated.top + translated.height / 2 : null);
  return y !== null && y > event.over.rect.top + event.over.rect.height / 2;
}
