'use client';

import { useEffect, useState } from 'react';
import { columns as initialColumns, agents, initialTasks, subscribeToUpdates, updateTaskStatus } from '@/lib/data';
import { Task, KanbanColumn } from '@/types';
import KanbanColumnSimple from '@/components/KanbanColumnSimple';
import AgentStatus from '@/components/AgentStatus';
import StatsPanel from '@/components/StatsPanel';
import { RefreshCw, Bell, Settings, Plus } from 'lucide-react';

export default function Home() {
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // 在客户端设置初始时间
  useEffect(() => {
    setLastUpdate(new Date());
  }, []);

  // 订阅实时更新
  useEffect(() => {
    const unsubscribe = subscribeToUpdates((updatedTasks) => {
      setTasks(updatedTasks);
      updateColumns(updatedTasks);
      setLastUpdate(new Date());
    });

    return unsubscribe;
  }, []);

  // 更新列数据
  const updateColumns = (taskList: Task[]) => {
    const newColumns: KanbanColumn[] = [
      {
        id: 'todo',
        title: '待办',
        tasks: taskList.filter(task => task.status === 'todo'),
      },
      {
        id: 'in_progress',
        title: '进行中',
        tasks: taskList.filter(task => task.status === 'in_progress'),
      },
      {
        id: 'done',
        title: '已完成',
        tasks: taskList.filter(task => task.status === 'done'),
      },
    ];
    setColumns(newColumns);
  };

  // 更新任务状态（模拟拖拽效果）
  const handleTaskMove = (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
    const success = updateTaskStatus(taskId, newStatus);
    if (success) {
      const updatedTasks = tasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            status: newStatus,
            updatedAt: new Date(),
          };
        }
        return task;
      });

      setTasks(updatedTasks);
      updateColumns(updatedTasks);
      setLastUpdate(new Date());
    }
  };

  // 手动刷新
  const handleRefresh = () => {
    setIsUpdating(true);
    setTimeout(() => {
      updateColumns(tasks);
      setLastUpdate(new Date());
      setIsUpdating(false);
    }, 500);
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-100">
      {/* 顶部导航 */}
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent 任务看板</h1>
            <p className="text-gray-600 mt-1">
              实时展示 Agent 任务状态 • 所有任务都与 Agent 强关联
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-500" suppressHydrationWarning>
              最后更新: {lastUpdate ? lastUpdate.toLocaleTimeString('zh-CN') : '--:--:--'}
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isUpdating}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? '更新中...' : '刷新'}
            </button>
            
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-500 hover:text-gray-700">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 统计面板 */}
      <StatsPanel tasks={tasks} />

      {/* Agent 状态 */}
      <AgentStatus agents={agents} />

      {/* 看板区域 */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">任务看板</h2>
          <button className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            <Plus className="w-4 h-4 mr-2" />
            添加任务
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {columns.map(column => (
            <KanbanColumnSimple key={column.id} column={column} />
          ))}
        </div>
      </div>

      {/* 底部信息 */}
      <footer className="mt-12 pt-6 border-t text-center text-gray-500 text-sm">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <p>🦞 由 龙虾机器人 构建 • 实时同步 Agent 任务状态</p>
            <p className="mt-1">所有任务都与 Agent 强关联，实时更新</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center justify-center space-x-4">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                Next.js 15
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                TypeScript
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                Tailwind CSS
              </span>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                实时更新
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs">
          <p>当前展示 {tasks.length} 个任务 • {agents.length} 个 Agent 在线</p>
          <p className="mt-1">系统每30秒自动更新任务状态</p>
        </div>
      </footer>
    </div>
  );
}