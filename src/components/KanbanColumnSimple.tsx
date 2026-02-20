'use client';

import { useState } from 'react';
import { Task, KanbanColumn as ColumnType } from '@/types';
import TaskCardSimple from './TaskCardSimple';
import { ChevronDown, ChevronUp, Hash, Globe, Clock, MessageSquare, HelpCircle } from 'lucide-react';

interface KanbanColumnProps {
  column: ColumnType;
}

// 状态说明配置
const statusHelpInfo: { [key: string]: { title: string; description: string; rules?: string[] } } = {
  todo: {
    title: '待办任务',
    description: '等待处理的任务',
    rules: ['新创建的任务默认进入此列'],
  },
  in_progress: {
    title: '进行中任务',
    description: 'Agent 正在处理的任务',
    rules: [
      '5 分钟内活跃的任务',
      'Agent 在线时正在执行',
    ],
  },
  done: {
    title: '已完成任务',
    description: '已经完成的任务',
    rules: [
      'Agent 会话正常结束',
      '任务目标已达成',
    ],
  },
  offline: {
    title: '已离线任务',
    description: 'Agent 暂时离线的任务',
    rules: [
      '30 分钟以上未活跃自动转入',
      'Agent 重新在线后可恢复为进行中',
    ],
  },
};

// 与 AgentStatus 组件保持一致的分组逻辑
function groupTasksByChannel(tasks: Task[]) {
  const groups: { [key: string]: Task[] } = {};
  
  tasks.forEach(task => {
    // 提取通道类型 - 与 AgentStatus 保持一致
    let channelKey = 'other';
    
    if (task.agentId?.includes('discord')) {
      channelKey = 'discord';
    } else if (task.agentId?.includes('webchat')) {
      channelKey = 'webchat';
    } else if (task.agentId?.includes('cron')) {
      channelKey = 'cron';
    }
    
    if (!groups[channelKey]) {
      groups[channelKey] = [];
    }
    groups[channelKey].push(task);
  });
  
  // 转换为数组并排序 - 与 AgentStatus 保持一致
  return Object.entries(groups).map(([key, tasks]) => ({
    key,
    name: getChannelDisplayName(key),
    icon: getChannelIcon(key),
    color: getChannelColor(key),
    tasks: tasks.sort((a, b) => {
      // 进行中的排在前面
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (a.status !== 'in_progress' && b.status === 'in_progress') return 1;
      // 然后按优先级
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 4) - 
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 4);
    }),
  })).sort((a, b) => {
    // Discord 优先 - 与 AgentStatus 保持一致
    if (a.key === 'discord') return -1;
    if (b.key === 'discord') return 1;
    return a.name.localeCompare(b.name);
  });
}

function getChannelDisplayName(key: string): string {
  const names: { [key: string]: string } = {
    discord: 'Discord 频道',
    webchat: 'WebChat 会话',
    cron: '定时任务',
    other: '其他会话',
  };
  return names[key] || '其他';
}

function getChannelIcon(key: string) {
  switch (key) {
    case 'discord':
      return <MessageSquare className="w-4 h-4" />;
    case 'webchat':
      return <Globe className="w-4 h-4" />;
    case 'cron':
      return <Clock className="w-4 h-4" />;
    default:
      return <Hash className="w-4 h-4" />;
  }
}

function getChannelColor(key: string): string {
  switch (key) {
    case 'discord':
      return 'bg-indigo-50 border-indigo-200 text-indigo-700';
    case 'webchat':
      return 'bg-blue-50 border-blue-200 text-blue-700';
    case 'cron':
      return 'bg-orange-50 border-orange-200 text-orange-700';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-700';
  }
}

export default function KanbanColumnSimple({ column }: KanbanColumnProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['discord', 'webchat']));
  const [showHelp, setShowHelp] = useState(false);
  
  const groupedTasks = groupTasksByChannel(column.tasks);
  const helpInfo = statusHelpInfo[column.id] || { title: '未知状态', description: '', rules: [] };
  
  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
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
        
        {/* 帮助信息图标 */}
        <div 
          className="relative"
          onMouseEnter={() => setShowHelp(true)}
          onMouseLeave={() => setShowHelp(false)}
        >
          <button 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="帮助信息"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          
          {/* 悬停提示框 */}
          {showHelp && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in duration-200">
              <div className="flex items-center mb-2">
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  column.id === 'todo' ? 'bg-gray-400' :
                  column.id === 'in_progress' ? 'bg-blue-500' :
                  column.id === 'done' ? 'bg-green-500' :
                  'bg-gray-500'
                }`} />
                <h3 className="font-semibold text-gray-800">{helpInfo.title}</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {helpInfo.description}
              </p>
              
              {helpInfo.rules && helpInfo.rules.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">状态规则：</p>
                  <ul className="space-y-1.5">
                    {helpInfo.rules.map((rule, index) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start">
                        <span className="mr-1.5 text-gray-400">•</span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 小三角箭头 */}
              <div className="absolute -top-1.5 right-3 w-3 h-3 bg-white border-l border-t border-gray-200 transform rotate-45" />
            </div>
          )}
        </div>
      </div>
      
      {/* 任务列表 - 按通道聚合 */}
      <div className="space-y-3">
        {groupedTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📋</div>
            <p className="text-sm">暂无任务</p>
          </div>
        ) : (
          groupedTasks.map((group) => {
            const isExpanded = expandedGroups.has(group.key);
            
            return (
              <div 
                key={group.key}
                className={`rounded-xl border overflow-hidden ${group.color}`}
              >
                {/* 分组标题 - 与 AgentStatus 风格一致 */}
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/50 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm">
                      {group.icon}
                    </div>
                    <div className="text-left">
                      <span className="font-semibold text-gray-800">{group.name}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({group.tasks.length} 个任务)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* 进行中任务数指示 */}
                    {group.tasks.filter((t: Task) => t.status === 'in_progress').length > 0 && (
                      <span className="flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                        {group.tasks.filter((t: Task) => t.status === 'in_progress').length} 进行中
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
                  <div className="px-3 pb-3 space-y-2">
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