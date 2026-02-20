export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'offline';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  agentId: string;
  agentName: string;
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  progress?: number; // 0-100
  estimatedTime?: number; // 分钟
  actualTime?: number; // 分钟
  dependencies?: string[]; // 依赖的任务ID
}

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy';
  currentTask?: string;
  tasksCompleted: number;
  lastActive?: string;
  cpu?: number; // CPU 使用率 0-100
  memory?: number; // 内存使用率 0-100
  channel?: string; // 频道/通道名称
  model?: string; // 使用的模型
  tokens?: number; // Token 使用量
  compactionCount?: number; // 压缩次数
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

// WebSocket 消息类型
export interface WSMessage {
  type: 'agents_update' | 'tasks_update' | 'agent_status_change' | 'connection';
  data: any;
  timestamp: string;
}