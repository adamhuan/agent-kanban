'use client';

import { Task } from '@/types';
import { BarChart3, CheckSquare, Clock, TrendingUp } from 'lucide-react';

interface StatsPanelProps {
  tasks: Task[];
}

export default function StatsPanel({ tasks }: StatsPanelProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const todoTasks = tasks.filter(t => t.status === 'todo').length;
  
  const totalEstimatedTime = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0);
  const totalActualTime = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
  
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const efficiency = totalEstimatedTime > 0 ? Math.round((totalActualTime / totalEstimatedTime) * 100) : 100;
  
  const stats = [
    {
      title: '总任务数',
      value: totalTasks,
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: '已完成',
      value: completedTasks,
      icon: <CheckSquare className="w-5 h-5" />,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: '进行中',
      value: inProgressTasks,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      title: '完成率',
      value: `${completionRate}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-purple-100 text-purple-600',
    },
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">任务统计</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-full ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
            </div>
            <div className="text-sm text-gray-600">{stat.title}</div>
          </div>
        ))}
      </div>
      
      {/* 时间统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-3 rounded-lg border">
          <div className="flex items-center mb-2">
            <Clock className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">时间统计</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">预估总时间:</span>
              <span className="font-medium">{Math.floor(totalEstimatedTime / 60)} 小时</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">实际总时间:</span>
              <span className="font-medium">{Math.floor(totalActualTime / 60)} 小时</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">效率:</span>
              <span className={`font-medium ${efficiency <= 100 ? 'text-green-600' : 'text-red-600'}`}>
                {efficiency}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="p-3 rounded-lg border">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">任务分布</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">待办 ({todoTasks})</span>
                <span>{Math.round((todoTasks / totalTasks) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-400 h-2 rounded-full"
                  style={{ width: `${(todoTasks / totalTasks) * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">进行中 ({inProgressTasks})</span>
                <span>{Math.round((inProgressTasks / totalTasks) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(inProgressTasks / totalTasks) * 100}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">已完成 ({completedTasks})</span>
                <span>{Math.round((completedTasks / totalTasks) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}