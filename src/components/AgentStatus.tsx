'use client';

import { Agent } from '@/types';
import { Users, Activity, CheckCircle, Clock, XCircle } from 'lucide-react';

interface AgentStatusProps {
  agents: Agent[];
}

const statusColors = {
  online: 'bg-green-100 text-green-800',
  offline: 'bg-gray-100 text-gray-800',
  busy: 'bg-yellow-100 text-yellow-800',
};

const statusIcons = {
  online: <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />,
  offline: <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />,
  busy: <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />,
};

export default function AgentStatus({ agents }: AgentStatusProps) {
  const onlineAgents = agents.filter(a => a.status === 'online' || a.status === 'busy');
  const busyAgents = agents.filter(a => a.status === 'busy');
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Users className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">Agent 状态</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Activity className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-sm text-gray-600">
              {onlineAgents.length}/{agents.length} 在线
            </span>
          </div>
          
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-sm text-gray-600">
              {busyAgents.length} 忙碌中
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {agents.map(agent => (
          <div 
            key={agent.id}
            className={`p-3 rounded-lg border ${
              agent.status === 'busy' ? 'border-yellow-300 bg-yellow-50' :
              agent.status === 'online' ? 'border-green-300 bg-green-50' :
              'border-gray-300 bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold mr-2">
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">{agent.name}</h3>
                  <div className="flex items-center text-xs">
                    {statusIcons[agent.status]}
                    <span className={`px-2 py-0.5 rounded-full ${statusColors[agent.status]}`}>
                      {agent.status === 'online' ? '在线' : 
                       agent.status === 'offline' ? '离线' : '忙碌中'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <CheckCircle className="w-3 h-3 mr-1" />
                {agent.tasksCompleted}
              </div>
            </div>
            
            {agent.currentTask && (
              <div className="text-xs text-gray-600 mt-2">
                <div className="font-medium">当前任务:</div>
                <div className="truncate">{agent.currentTask}</div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}