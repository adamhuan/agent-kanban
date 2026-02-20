'use client';

import { KanbanColumn as ColumnType } from '@/types';
import { Droppable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

interface KanbanColumnProps {
  column: ColumnType;
}

const columnColors = {
  todo: 'bg-gray-50 border-gray-200',
  in_progress: 'bg-blue-50 border-blue-200',
  done: 'bg-green-50 border-green-200',
};

const columnTitles = {
  todo: '待办',
  in_progress: '进行中',
  done: '已完成',
};

const columnCountColors = {
  todo: 'bg-gray-200 text-gray-700',
  in_progress: 'bg-blue-200 text-blue-700',
  done: 'bg-green-200 text-green-700',
};

export default function KanbanColumn({ column }: KanbanColumnProps) {
  return (
    <div className={`flex-1 min-w-[300px] rounded-lg border p-4 ${columnColors[column.id]}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800">{column.title}</h2>
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${columnCountColors[column.id]}`}>
            {column.tasks.length}
          </span>
        </div>
        
        {column.id === 'in_progress' && (
          <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
            实时更新中
          </div>
        )}
      </div>
      
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[500px] transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-opacity-50' : ''
            }`}
          >
            {column.tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} />
            ))}
            {provided.placeholder}
            
            {column.tasks.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <p>暂无任务</p>
                <p className="text-sm mt-1">拖拽任务到这里</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}