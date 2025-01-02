"use client";
import React, { FC, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DraggableItem, { ItemType } from './DraggableItem';

interface Item {
  id: number;
  text: string;
}

const DraggableContainer: FC = () => {
  const [items, setItems] = useState<Item[]>([
    { id: 1, text: 'Item 1' },
    { id: 2, text: 'Item 2' },
    { id: 3, text: 'Item 3' },
    { id: 4, text: 'Item 4' },
  ]);

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const updatedItems = [...items];
    const [draggedItem] = updatedItems.splice(dragIndex, 1);
    updatedItems.splice(hoverIndex, 0, draggedItem);
    setItems(updatedItems);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        {items.map((item, index) => (
          <DraggableItem
            key={item.id}
            id={item.id}
            index={index}
            text={item.text}
            moveItem={moveItem}
          />
        ))}
      </div>
    </DndProvider>
  );
};

export default DraggableContainer;
