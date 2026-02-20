'use client';

import { useState } from 'react';
import { Agent } from '@/types';
import { Users, Activity, CheckCircle, Cpu, HardDrive, ChevronDown, ChevronUp, Hash, Globe, Clock, MessageSquare } from 'lucide-react';

interface AgentStatusProps {
  agents: Agent[];
}

const statusColors = {
  online: 'bg-green-100 text-green-800 border-green-300',
  offline: 'bg-gray-100 text-gray-800 border-gray-300',
  busy: 'bg-yellow-100 text-yellow-800 border-yellow-300',
};

const statusIcons = {
  online: <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 animate-pulse shadow-sm" />,
  offline: <div className="w-2.5 h-2.5 bg-gray-400 rounded-full mr-2" />,
  busy: <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full mr-2 animate-pulse shadow-sm" />,
};

// 按通道/提供商分组 Agent
function groupAgentsByChannel(agents: Agent[]) {
  const groups: { [key: string]: Agent[] } = {};
  
  agents.forEach(agent => {
    // 提取通道类型
    let channelType = '其他';
    let channelKey = 'other';
    
    if (agent.id.includes('discord')) {
      channelType = 'Discord';
      channelKey = 'discord';
    } else if (agent.id.includes('webchat')) {
      channelType = 'WebChat';
      channelKey = 'webchat';
    } else if (agent.id.includes('cron')) {
      channelType = '定时任务';
      channelKey = 'cron';
    }
    
    if (!groups[channelKey]) {
      groups[channelKey] = [];
    }
    groups[channelKey].push(agent);
  });
  
  // 转换为数组并排序
  return Object.entries(groups).map(([key, agents]) => ({
    key,
    name: getChannelDisplayName(key),
    icon: getChannelIcon(key),
    agents: agents.sort((a, b) => {
      // 在线的排在前面
      if (a.status === 'online' && b.status !== 'online') return -1;
      if (a.status !== 'online' && b.status === 'online') return 1;
      return a.name.localeCompare(b.name);
    }),
  })).sort((a, b) => {
    // Discord 优先
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

// 提取频道名称
function getChannelName(agent: Agent): string {
  if (agent.channel) {
    return agent.channel.replace('#', '');
  }
  
  // 从 ID 中提取
  if (agent.id.includes('discord:channel:')) {
    const match = agent.id.match(/channel:(\d+)/);
    if (match) return `频道-${match[1].slice(-4)}`;
  }
  
  return '默认';
}

export default function AgentStatus({ agents }: AgentStatusProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['discord', 'webchat']));
  
  const groupedAgents = groupAgentsByChannel(agents);
  
  const onlineAgents = agents.filter(a => a.status === 'online' || a.status === 'busy');
  const busyAgents = agents.filter(a => a.status === 'busy');
  const totalCpu = agents.reduce((sum, a) => sum + (a.cpu || 0), 0) / agents.length || 0;
  const totalMemory = agents.reduce((sum, a) => sum + (a.memory || 0), 0) / agents.length || 0;
  
  const toggleGroup = (key: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedGroups(newExpanded);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
      {/* 头部统计 */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 shadow-sm">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Agent 状态监控</h2>
            <p className="text-sm text-gray-500">{agents.length} 个会话 • {onlineAgents.length} 个在线</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
            <Cpu className="w-4 h-4 text-blue-500 mr-1.5" />
            <span className="text-sm text-gray-600">
              CPU: <span className="font-semibold text-gray-800">{totalCpu.toFixed(1)}%</span>
            </span>
          </div>
          
          <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
            <HardDrive className="w-4 h-4 text-purple-500 mr-1.5" />
            <span className="text-sm text-gray-600">
              内存: <span className="font-semibold text-gray-800">{totalMemory.toFixed(1)}%</span>
            </span>
          </div>
          
          <div className="flex items-center bg-gray-50 px-3 py-1.5 rounded-lg">
            <Activity className="w-4 h-4 text-green-500 mr-1.5" />
            <span className="text-sm text-gray-600">
              忙碌: <span className="font-semibold text-yellow-600">{busyAgents.length}</span>
            </span>
          </div>
        </div>
      </div>
      
      {/* 分组列表 */}
      <div className="space-y-3">
        {groupedAgents.map((group) => {
          const isExpanded = expandedGroups.has(group.key);
          const onlineCount = group.agents.filter(a => a.status === 'online').length;
          const busyCount = group.agents.filter(a => a.status === 'busy').length;
          
          return (
            <div 
              key={group.key}
              className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50/50"
            >
              {/* 分组标题 */}
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3 shadow-sm text-gray-600">
                    {group.icon}
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-gray-800">{group.name}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({group.agents.length} 个会话)
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* 在线状态指示 */}
                  <div className="flex items-center space-x-2">
                    {onlineCount > 0 && (
                      <span className="flex items-center px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                        {onlineCount} 在线
                      </span>
                    )}
                    {busyCount > 0 && (
                      <span className="flex items-center px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1" />
                        {busyCount} 忙碌
                      </span>
                    )}
                  </div>
                  
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>
              
              {/* 展开的 Agent 列表 */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 space-y-2">
                  {group.agents.map((agent) => (
                    <div 
                      key={agent.id}
                      className={`bg-white rounded-lg border p-3 transition-all hover:shadow-md ${
                        agent.status === 'busy' ? 'border-yellow-300' :
                        agent.status === 'online' ? 'border-green-300' :
                        'border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center flex-1 min-w-0">
                          {/* 头像 */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-lg mr-3 flex-shrink-0 shadow-sm">
                            {agent.avatar || agent.name.charAt(0)}
                          </div>
                          
                          {/* 名称和状态 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2">
                              <h3 className="font-semibold text-gray-800 truncate">
                                {agent.name.replace('龙虾机器人 🦞', '').trim() || '主会话'}
                              </h3>
                              
                              {/* 状态标签 */}
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center ${statusColors[agent.status as keyof typeof statusColors]}`}>
                                {statusIcons[agent.status as keyof typeof statusIcons]}
                                {agent.status === 'online' ? '在线' : 
                                 agent.status === 'offline' ? '离线' : '忙碌中'}
                              </span>
                            </div>
                            
                            {/* 当前任务 */}
                            {agent.currentTask && (
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {agent.currentTask}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* 右侧统计 */}
                        <div className="flex items-center space-x-3 ml-4 flex-shrink-0">
                          <div className="text-xs text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {agent.tasksCompleted}K
                          </div>
                          
                          {agent.model && (
                            <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded">
                              {agent.model}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* CPU 和内存使用率 */}
                      {agent.status !== 'offline' && (
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">CPU</span>
                              <span className={`font-medium ${
                                (agent.cpu || 0) > 80 ? 'text-red-600' : 
                                (agent.cpu || 0) > 50 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {agent.cpu?.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  (agent.cpu || 0) > 80 ? 'bg-red-500' : 
                                  (agent.cpu || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${agent.cpu || 0}%` }}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">内存</span>
                              <span className={`font-medium ${
                                (agent.memory || 0) > 80 ? 'text-red-600' : 
                                (agent.memory || 0) > 50 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {agent.memory?.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  (agent.memory || 0) > 80 ? 'bg-red-500' : 
                                  (agent.memory || 0) > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${agent.memory || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}