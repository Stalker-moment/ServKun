import React, { FC, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

export const ItemType = 'ITEM';

interface DraggableItemProps {
  id: number;
  text: string;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
}

const DraggableItem: FC<DraggableItemProps> = ({ id, text, index, moveItem }) => {
  const ref = useRef<HTMLDivElement>(null);

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) return;

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset?.y || 0) - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`p-4 rounded-md border cursor-grab ${
        isDragging
          ? 'bg-gray-300 dark:bg-gray-600'
          : 'bg-white dark:bg-gray-800'
      }`}
    >
      {text}
    </div>
  );
};

export default DraggableItem;
