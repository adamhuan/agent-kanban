import { Task, Agent, KanbanColumn, TaskStatus } from '@/types';

// 模拟数据 - 这些任务都与 Agent 强关联
export const agents: Agent[] = [
  {
    id: 'agent-1',
    name: '龙虾机器人 🦞',
    status: 'busy',
    currentTask: 'task-3',
    tasksCompleted: 42,
  },
  {
    id: 'agent-2',
    name: '代码助手 🤖',
    status: 'online',
    currentTask: 'task-5',
    tasksCompleted: 28,
  },
  {
    id: 'agent-3',
    name: '运维专家 🛠️',
    status: 'online',
    currentTask: 'task-2',
    tasksCompleted: 15,
  },
  {
    id: 'agent-4',
    name: '数据分析师 📊',
    status: 'offline',
    tasksCompleted: 7,
  },
];

export const initialTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Harbor HA 集群部署',
    description: '部署高可用 Harbor 容器镜像仓库集群，包含 PostgreSQL、Redis、HAProxy 等组件',
    status: 'done',
    agentId: 'agent-1',
    agentName: '龙虾机器人 🦞',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T18:30:00Z',
    priority: 'high',
    tags: ['devops', 'docker', 'kubernetes', 'ansible'],
    progress: 100,
    estimatedTime: 240,
    actualTime: 210,
  },
  {
    id: 'task-2',
    title: '服务器监控系统配置',
    description: '配置 Prometheus + Grafana 监控系统，设置告警规则和仪表板',
    status: 'in_progress',
    agentId: 'agent-3',
    agentName: '运维专家 🛠️',
    createdAt: '2026-02-20T14:00:00Z',
    updatedAt: '2026-02-20T21:15:00Z',
    priority: 'medium',
    tags: ['monitoring', 'prometheus', 'grafana'],
    progress: 65,
    estimatedTime: 180,
    actualTime: 120,
  },
  {
    id: 'task-3',
    title: 'Next.js 看板应用开发',
    description: '开发实时任务看板应用，展示 Agent 任务状态，支持拖拽和实时更新',
    status: 'in_progress',
    agentId: 'agent-1',
    agentName: '龙虾机器人 🦞',
    createdAt: '2026-02-20T21:10:00Z',
    updatedAt: '2026-02-20T22:10:00Z',
    priority: 'critical',
    tags: ['nextjs', 'react', 'typescript', 'tailwind'],
    progress: 40,
    estimatedTime: 120,
    actualTime: 60,
  },
  {
    id: 'task-4',
    title: 'API 文档自动生成',
    description: '使用 Swagger/OpenAPI 自动生成 API 文档，集成到 CI/CD 流程',
    status: 'todo',
    agentId: 'agent-2',
    agentName: '代码助手 🤖',
    createdAt: '2026-02-20T16:00:00Z',
    updatedAt: '2026-02-20T16:00:00Z',
    priority: 'medium',
    tags: ['api', 'documentation', 'swagger'],
    progress: 0,
    estimatedTime: 90,
  },
  {
    id: 'task-5',
    title: '数据库性能优化',
    description: '分析 PostgreSQL 性能瓶颈，优化查询和索引配置',
    status: 'in_progress',
    agentId: 'agent-2',
    agentName: '代码助手 🤖',
    createdAt: '2026-02-20T09:00:00Z',
    updatedAt: '2026-02-20T20:45:00Z',
    priority: 'high',
    tags: ['database', 'postgresql', 'performance'],
    progress: 80,
    estimatedTime: 300,
    actualTime: 240,
  },
  {
    id: 'task-6',
    title: '日志分析系统搭建',
    description: '搭建 ELK Stack 日志分析系统，配置日志收集和可视化',
    status: 'todo',
    agentId: 'agent-3',
    agentName: '运维专家 🛠️',
    createdAt: '2026-02-21T08:00:00Z',
    updatedAt: '2026-02-21T08:00:00Z',
    priority: 'medium',
    tags: ['logging', 'elk', 'elasticsearch'],
    progress: 0,
    estimatedTime: 240,
  },
  {
    id: 'task-7',
    title: '机器学习模型训练',
    description: '训练文本分类模型，优化准确率和性能',
    status: 'todo',
    agentId: 'agent-4',
    agentName: '数据分析师 📊',
    createdAt: '2026-02-21T10:00:00Z',
    updatedAt: '2026-02-21T10:00:00Z',
    priority: 'low',
    tags: ['ml', 'ai', 'python'],
    progress: 0,
    estimatedTime: 480,
  },
  {
    id: 'task-8',
    title: 'CI/CD 流水线优化',
    description: '优化 Jenkins/GitLab CI 流水线，减少构建时间和提高可靠性',
    status: 'done',
    agentId: 'agent-1',
    agentName: '龙虾机器人 🦞',
    createdAt: '2026-02-19T09:00:00Z',
    updatedAt: '2026-02-19T17:30:00Z',
    priority: 'high',
    tags: ['ci-cd', 'jenkins', 'gitlab'],
    progress: 100,
    estimatedTime: 180,
    actualTime: 150,
  },
];

export const columns: KanbanColumn[] = [
  {
    id: 'todo',
    title: '待办',
    tasks: initialTasks.filter(task => task.status === 'todo'),
  },
  {
    id: 'in_progress',
    title: '进行中',
    tasks: initialTasks.filter(task => task.status === 'in_progress'),
  },
  {
    id: 'done',
    title: '已完成',
    tasks: initialTasks.filter(task => task.status === 'done'),
  },
];

// 模拟实时更新 - 在实际应用中，这里会连接 WebSocket 或使用 Server-Sent Events
export function subscribeToUpdates(callback: (tasks: Task[]) => void) {
  // 模拟实时更新 - 每30秒随机更新一个任务
  const interval = setInterval(() => {
    const updatedTasks = [...initialTasks];
    const randomIndex = Math.floor(Math.random() * updatedTasks.length);
    const task = updatedTasks[randomIndex];
    
    if (task.status === 'todo') {
      task.status = 'in_progress';
      task.progress = Math.floor(Math.random() * 30) + 10;
    } else if (task.status === 'in_progress') {
      if (task.progress && task.progress >= 90) {
        task.status = 'done';
        task.progress = 100;
      } else {
        task.progress = (task.progress || 0) + Math.floor(Math.random() * 20) + 5;
        if (task.progress > 100) task.progress = 100;
      }
    }
    
    task.updatedAt = new Date().toISOString();
    callback(updatedTasks);
  }, 30000);

  return () => clearInterval(interval);
}

export function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  const task = initialTasks.find(t => t.id === taskId);
  if (task) {
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();
    
    if (newStatus === 'in_progress' && !task.progress) {
      task.progress = 10;
    } else if (newStatus === 'done') {
      task.progress = 100;
    }
    
    return true;
  }
  return false;
}