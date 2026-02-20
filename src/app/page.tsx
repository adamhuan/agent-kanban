'use client';

import { useEffect, useState } from 'react';
import { agents as initialAgents, initialTasks } from '@/lib/data';
import { Task, Agent, KanbanColumn } from '@/types';
import KanbanColumnSimple from '@/components/KanbanColumnSimple';
import AgentStatus from '@/components/AgentStatus';
import StatsPanel from '@/components/StatsPanel';
import ConfigPanel from '@/components/ConfigPanel';
import { RefreshCw, Bell, Plus, Wifi, WifiOff, Settings, Server } from 'lucide-react';
import { getOpenClawMonitor, ServerConfig } from '@/lib/websocket';

export default function Home() {
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [activeServerId, setActiveServerId] = useState<string | null>(null);
  const [activeServerName, setActiveServerName] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // WebSocket 连接
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const monitor = getOpenClawMonitor();
    
    // 初始化服务器列表
    setServers(monitor.getServers());
    const activeServer = monitor.getActiveServerConfig();
    setActiveServerId(activeServer?.id || null);
    setActiveServerName(activeServer?.name || '');
    
    // 监听连接状态
    const unsubscribeStatus = monitor.onConnectionStatus((status) => {
      setConnectionStatus(status);
    });

    // 监听 Agent 数据
    const unsubscribeAgents = monitor.on('agents', (data) => {
      setAgents(data);
      setLastUpdate(new Date());
    });

    // 监听任务数据
    const unsubscribeTasks = monitor.on('tasks', (data) => {
      setTasks(data);
      updateColumns(data);
      setLastUpdate(new Date());
    });

    return () => {
      unsubscribeStatus();
      unsubscribeAgents();
      unsubscribeTasks();
    };
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

  // 手动刷新
  const handleRefresh = () => {
    setIsUpdating(true);
    setTimeout(() => {
      setLastUpdate(new Date());
      setIsUpdating(false);
    }, 500);
  };

  // 添加服务器
  const handleAddServer = (name: string, url: string) => {
    const monitor = getOpenClawMonitor();
    const newServer = monitor.addServer(name, url);
    setServers(monitor.getServers());
    // 自动切换到新服务器
    monitor.switchServer(newServer.id);
    setActiveServerId(newServer.id);
    setActiveServerName(newServer.name);
  };

  // 删除服务器
  const handleRemoveServer = (id: string) => {
    const monitor = getOpenClawMonitor();
    if (monitor.removeServer(id)) {
      setServers(monitor.getServers());
      const active = monitor.getActiveServerConfig();
      setActiveServerId(active?.id || null);
      setActiveServerName(active?.name || '');
    }
  };

  // 切换服务器
  const handleSwitchServer = (id: string) => {
    const monitor = getOpenClawMonitor();
    if (monitor.switchServer(id)) {
      setActiveServerId(id);
      const server = monitor.getServers().find(s => s.id === id);
      setActiveServerName(server?.name || '');
    }
  };

  // 更新服务器
  const handleUpdateServer = (id: string, updates: Partial<ServerConfig>) => {
    const monitor = getOpenClawMonitor();
    if (monitor.updateServer(id, updates)) {
      setServers(monitor.getServers());
      if (id === activeServerId) {
        const server = monitor.getServers().find(s => s.id === id);
        setActiveServerName(server?.name || '');
      }
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'disconnected':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // 获取状态文本
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return '已连接';
      case 'connecting':
        return '连接中...';
      case 'disconnected':
        return '已断开';
      default:
        return '未知';
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gray-100">
      {/* 配置面板 */}
      <ConfigPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        servers={servers}
        activeServerId={activeServerId}
        onAddServer={handleAddServer}
        onRemoveServer={handleRemoveServer}
        onSwitchServer={handleSwitchServer}
        onUpdateServer={handleUpdateServer}
        connectionStatus={connectionStatus}
      />

      {/* 顶部导航 */}
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agent 任务看板</h1>
            <p className="text-gray-600 mt-1">
              实时展示 Agent 任务状态 • 所有任务都与 Agent 强关联
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 连接状态指示器 */}
            <div 
              className={`flex items-center px-3 py-1.5 rounded-full text-sm cursor-pointer hover:opacity-80 transition-opacity border ${getStatusColor()}`}
              onClick={() => setIsConfigOpen(true)}
              title="点击配置 WebSocket 连接"
            >
              {connectionStatus === 'connected' ? (
                <Wifi className="w-4 h-4 mr-1.5" />
              ) : connectionStatus === 'connecting' ? (
                <Wifi className="w-4 h-4 mr-1.5 animate-pulse" />
              ) : (
                <WifiOff className="w-4 h-4 mr-1.5" />
              )}
              <span>{getStatusText()}</span>
            </div>

            <div className="text-sm text-gray-500 hidden md:block" suppressHydrationWarning>
              最后更新: {lastUpdate ? lastUpdate.toLocaleTimeString('zh-CN') : '--:--:--'}
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={isUpdating}
              className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isUpdating ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isUpdating ? '更新中...' : '刷新'}</span>
            </button>
            
            <button 
              onClick={() => setIsConfigOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              title="配置 WebSocket 连接"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
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
          <button className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            添加任务
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {columns.length > 0 ? (
            columns.map(column => (
              <KanbanColumnSimple key={column.id} column={column} />
            ))
          ) : (
            // 加载状态
            <>
              {['todo', 'in_progress', 'done'].map((status) => (
                <div key={status} className="flex-1 min-w-[300px] rounded-lg border p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {status === 'todo' ? '待办' : status === 'in_progress' ? '进行中' : '已完成'}
                    </h2>
                    <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-200">
                      0
                    </span>
                  </div>
                  <div className="min-h-[300px] flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p>正在连接 OpenClaw...</p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* 底部信息 */}
      <footer className="mt-12 pt-6 border-t text-center text-gray-500 text-sm">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <p>🦞 由 龙虾机器人 构建 • 实时同步 OpenClaw Agent 状态</p>
            <p className="mt-1">WebSocket 实时连接 • 数据每 5 秒自动更新</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="flex items-center justify-center space-x-4">
              <button 
                onClick={() => setIsConfigOpen(true)}
                className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors cursor-pointer flex items-center"
              >
                <Server className="w-3 h-3 mr-1" />
                {activeServerName || '未连接'}
              </button>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                实时更新
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                OpenClaw
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 text-xs">
          <p>当前展示 {tasks.length} 个任务 • {agents.filter(a => a.status === 'online').length} 个 Agent 在线</p>
        </div>
      </footer>
    </div>
  );
}