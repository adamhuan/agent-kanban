'use client';

import { Task } from '@/types';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, User, Tag, AlertCircle, CheckCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  index: number;
}

const priorityColors = {
  critical: 'bg-red-100 border-red-300 text-red-800',
  high: 'bg-orange-100 border-orange-300 text-orange-800',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
  low: 'bg-green-100 border-green-300 text-green-800',
};

const priorityIcons = {
  critical: <AlertCircle className="w-4 h-4" />,
  high: <AlertCircle className="w-4 h-4" />,
  medium: <AlertCircle className="w-4 h-4" />,
  low: <CheckCircle className="w-4 h-4" />,
};

export default function TaskCard({ task, index }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`
            bg-white rounded-lg shadow-sm border p-4 mb-3
            hover:shadow-md transition-shadow duration-200
            ${snapshot.isDragging ? 'shadow-lg rotate-1' : ''}
          `}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-800">{task.title}</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
              {task.priority === 'critical' ? '紧急' : 
               task.priority === 'high' ? '高' : 
               task.priority === 'medium' ? '中' : '低'}
            </span>
          </div>
          
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
          
          {/* 进度条 */}
          {task.progress !== undefined && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>进度</span>
                <span>{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
          
          {/* 标签 */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md flex items-center"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
              {task.tags.length > 3 && (
                <span className="px-2 py-1 text-gray-400 text-xs">
                  +{task.tags.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* 底部信息 */}
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              <span className="font-medium">{task.agentName}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              <span>
                {task.estimatedTime && `${Math.floor(task.estimatedTime / 60)}h`}
                {task.actualTime && ` / ${Math.floor(task.actualTime / 60)}h`}
              </span>
            </div>
          </div>
          
          {/* 更新时间 */}
          <div className="text-xs text-gray-400 mt-2">
            更新于 {task.updatedAt.toLocaleTimeString('zh-CN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      )}
    </Draggable>
  );
}