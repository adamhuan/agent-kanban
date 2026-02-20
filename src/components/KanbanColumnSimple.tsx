'use client';

import { useState } from 'react';
import { Task, KanbanColumn as ColumnType } from '@/types';
import TaskCardSimple from './TaskCardSimple';
import { ChevronDown, ChevronUp, Hash, Folder } from 'lucide-react';

interface KanbanColumnProps {
  column: ColumnType;
}

// 按实际频道名称聚合任务
function groupTasksByChannel(tasks: Task[]) {
  const groups: { [key: string]: Task[] } = {};
  
  tasks.forEach(task => {
    // 提取实际频道名称
    let channelName = '其他';
    let channelKey = 'other';
    
    // 从 title 中提取频道名（如 "#agent-devops"）
    if (task.title?.startsWith('#')) {
      channelName = task.title;
      channelKey = task.title.toLowerCase();
    } 
    // 从 tags 中提取
    else if (task.tags) {
      const channelTag = task.tags.find((t: string) => t.startsWith('#'));
      if (channelTag) {
        channelName = channelTag;
        channelKey = channelTag.toLowerCase();
      }
    }
    // cron 任务
    else if (task.agentId?.includes('cron')) {
      channelName = '定时任务';
      channelKey = 'cron';
    }
    
    if (!groups[channelKey]) {
      groups[channelKey] = [];
    }
    groups[channelKey].push(task);
  });
  
  // 转换为数组
  return Object.entries(groups).map(([key, tasks]) => ({
    key,
    name: tasks[0]?.title?.startsWith('#') ? tasks[0].title : 
          (key === 'cron' ? '定时任务' : 
           key === 'other' ? '其他' : key),
    icon: key === 'cron' ? '⏰' : '#',
    tasks: tasks.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
    }),
  })).sort((a, b) => {
    // cron 任务放最后
    if (a.key === 'cron') return 1;
    if (b.key === 'cron') return -1;
    // 其他按名称排序
    return a.name.localeCompare(b.name);
  });
}

export default function KanbanColumnSimple({ column }: KanbanColumnProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const groupedTasks = groupTasksByChannel(column.tasks);
  
  // 默认展开所有分组
  const effectiveExpanded = expandedGroups.size === 0 
    ? new Set(groupedTasks.map(g => g.key))
    : expandedGroups;
  
  const toggleGroup = (key: string) => {
    const newExpanded = new Set(effectiveExpanded);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };
  
  const getColumnColor = () => {
    switch (column.id) {
      case 'todo':
        return 'bg-gray-50 border-gray-200';
      case 'in_progress':
        return 'bg-blue-50/50 border-blue-200';
      case 'done':
        return 'bg-green-50/50 border-green-200';
      case 'offline':
        return 'bg-gray-100/50 border-gray-300';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  const getHeaderColor = () => {
    switch (column.id) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'offline':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className={`flex-1 min-w-[320px] max-w-[400px] rounded-xl border ${getColumnColor()} p-4`}>
      {/* 列标题 */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg font-bold text-gray-800">{column.title}</h2>
          <span className={`ml-2 px-2.5 py-1 rounded-full text-xs font-semibold ${getHeaderColor()}`}>
            {column.tasks.length}
          </span>
        </div>
      </div>
      
      {/* 任务列表 - 按频道聚合 */}
      <div className="space-y-3">
        {groupedTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">暂无任务</p>
          </div>
        ) : (
          groupedTasks.map((group) => {
            const isExpanded = effectiveExpanded.has(group.key);
            
            return (
              <div 
                key={group.key}
                className="rounded-xl border border-gray-200 overflow-hidden bg-white"
              >
                {/* 频道分组标题 */}
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center mr-2 shadow-sm text-gray-500">
                      {group.key === 'cron' ? (
                        <span className="text-sm">⏰</span>
                      ) : (
                        <Hash className="w-4 h-4" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-gray-800">{group.name}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({group.tasks.length})
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {/* 优先级标记 */}
                    {group.tasks.some((t: Task) => t.priority === 'critical' || t.priority === 'high') && (
                      <span className="mr-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded">
                        高优
                      </span>
                    )}
                    
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
                
                {/* 任务列表 */}
                {isExpanded && (
                  <div className="p-3 space-y-2">
                    {group.tasks.map((task) => (
                      <TaskCardSimple key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}