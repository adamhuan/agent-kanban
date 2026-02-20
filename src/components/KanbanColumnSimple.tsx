'use client';

import { KanbanColumn as ColumnType } from '@/types';
import TaskCardSimple from './TaskCardSimple';

interface KanbanColumnProps {
  column: ColumnType;
}

const columnColors = {
  todo: 'bg-gray-50 border-gray-200',
  in_progress: 'bg-blue-50 border-blue-200',
  done: 'bg-green-50 border-green-200',
};

const columnCountColors = {
  todo: 'bg-gray-200 text-gray-700',
  in_progress: 'bg-blue-200 text-blue-700',
  done: 'bg-green-200 text-green-700',
};

export default function KanbanColumnSimple({ column }: KanbanColumnProps) {
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
      
      <div className="min-h-[500px]">
        {column.tasks.map((task) => (
          <TaskCardSimple key={task.id} task={task} />
        ))}
        
        {column.tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p>暂无任务</p>
            <p className="text-sm mt-1">点击"添加任务"开始</p>
          </div>
        )}
      </div>
    </div>
  );
}