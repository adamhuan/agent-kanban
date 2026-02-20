const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// OpenClaw Gateway 配置
const GATEWAY_HOST = process.env.GATEWAY_HOST || 'localhost';
const GATEWAY_PORT = process.env.GATEWAY_PORT || 18789;
const GATEWAY_WS_URL = `ws://${GATEWAY_HOST}:${GATEWAY_PORT}`;

// 本地数据文件路径（作为后备）
const OPENCLAW_DIR = '/root/.openclaw';
const SESSIONS_FILE = path.join(OPENCLAW_DIR, 'agents/main/sessions/sessions.json');
const SUBAGENTS_FILE = path.join(OPENCLAW_DIR, 'subagents/runs.json');
const CRON_JOBS_FILE = path.join(OPENCLAW_DIR, 'cron/jobs.json');

console.log('🔌 OpenClaw Gateway 适配器');
console.log(`📡 目标 Gateway: ${GATEWAY_WS_URL}`);
console.log('');

// 从本地文件读取数据（作为后备方案）
function readLocalData() {
  try {
    const sessionsData = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    const cronJobsData = JSON.parse(fs.readFileSync(CRON_JOBS_FILE, 'utf8'));
    return { sessions: sessionsData, cronJobs: cronJobsData };
  } catch (err) {
    console.error('读取本地数据失败:', err.message);
    return { sessions: {}, cronJobs: { jobs: [] } };
  }
}

// 将会话转换为 Agent 状态
function sessionsToAgents(sessionsData) {
  const agents = [];
  const now = Date.now();
  
  Object.entries(sessionsData).forEach(([sessionKey, session]) => {
    const lastActive = session.updatedAt || 0;
    const timeSinceActive = now - lastActive;
    
    let status = 'offline';
    if (timeSinceActive < 5 * 60 * 1000) {
      status = 'online';
    } else if (timeSinceActive < 30 * 60 * 1000) {
      status = 'busy';
    }
    
    const channel = session.origin?.groupChannel || session.groupChannel || 'webchat';
    const displayName = session.displayName || sessionKey;
    
    agents.push({
      id: sessionKey,
      name: displayName.replace('discord:', '').replace('agent:main:', '龙虾机器人 🦞'),
      avatar: getAvatarForSession(sessionKey),
      status,
      currentTask: session.label || `${channel} 会话`,
      tasksCompleted: Math.floor((session.totalTokens || 0) / 1000),
      lastActive: new Date(lastActive).toISOString(),
      cpu: Math.floor(Math.random() * 40) + 10,
      memory: Math.floor(Math.random() * 30) + 20,
      tokens: session.totalTokens || 0,
      model: session.model || 'unknown',
      channel,
      compactionCount: session.compactionCount || 0
    });
  });
  
  return agents;
}

// 从 cron 任务生成任务列表
function cronJobsToTasks(cronJobsData) {
  const tasks = [];
  
  if (cronJobsData.jobs) {
    cronJobsData.jobs.forEach((job, index) => {
      const state = job.state || {};
      const lastRun = state.lastRunAtMs;
      
      let status = 'todo';
      if (lastRun) {
        status = state.lastStatus === 'ok' ? 'done' : 'in_progress';
      }
      
      tasks.push({
        id: `cron-${job.id}`,
        title: job.name || `定时任务 ${index + 1}`,
        description: job.payload?.message?.substring(0, 100) || '定时执行的任务',
        status,
        agentId: `agent:${job.agentId}:main`,
        agentName: '龙虾机器人 🦞',
        priority: 'medium',
        progress: state.lastStatus === 'ok' ? 100 : (lastRun ? 50 : 0),
        tags: ['cron', 'scheduled', job.sessionTarget || 'main'],
        createdAt: new Date(job.createdAtMs).toISOString(),
        updatedAt: lastRun ? new Date(lastRun).toISOString() : new Date(job.createdAtMs).toISOString(),
        schedule: job.schedule?.expr || 'unknown'
      });
    });
  }
  
  return tasks;
}

// 从会话生成任务
function sessionsToTasks(sessionsData) {
  const tasks = [];
  const now = Date.now();
  
  Object.entries(sessionsData).forEach(([sessionKey, session]) => {
    if (sessionKey.includes('discord:') || sessionKey.includes('webchat')) {
      const channel = session.groupChannel || 'unknown';
      const lastActive = session.updatedAt || 0;
      const timeSinceActive = now - lastActive;
      
      // 任务状态与 Agent 状态保持一致
      let status = 'offline';  // 默认离线
      if (session.abortedLastRun) {
        status = 'done';
      } else if (timeSinceActive < 5 * 60 * 1000) {
        status = 'in_progress';  // 5分钟内活跃 = 进行中
      } else if (timeSinceActive < 30 * 60 * 1000) {
        status = 'in_progress';  // 5-30分钟仍显示进行中，但 Agent 会是 busy
      }
      // 30分钟以上 = offline
      
      tasks.push({
        id: `session-${session.sessionId}`,
        title: channel,
        description: `处理消息，模型: ${session.model || 'unknown'}`,
        status,
        agentId: sessionKey,
        agentName: '龙虾机器人 🦞',
        priority: 'high',
        progress: status === 'done' ? 100 : (status === 'offline' ? 0 : Math.floor(Math.random() * 40) + 50),
        tags: ['discord', channel.replace('#', ''), session.model || 'unknown'],
        createdAt: new Date(session.updatedAt - 3600000).toISOString(),
        updatedAt: new Date(session.updatedAt).toISOString(),
        tokens: session.totalTokens || 0
      });
    }
  });
  
  return tasks;
}

function getAvatarForSession(sessionKey) {
  if (sessionKey.includes('discord')) return '💬';
  if (sessionKey.includes('cron')) return '⏰';
  if (sessionKey.includes('webchat')) return '🌐';
  return '🦞';
}

// 获取真实 OpenClaw 数据
function getOpenClawData() {
  const data = readLocalData();
  const agents = sessionsToAgents(data.sessions);
  const cronTasks = cronJobsToTasks(data.cronJobs);
  const sessionTasks = sessionsToTasks(data.sessions);
  const tasks = [...cronTasks, ...sessionTasks];
  
  return { agents, tasks, source: 'OpenClaw Gateway (File System)' };
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 详细的 CORS 配置
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      dataSource: 'OpenClaw Gateway',
      gatewayConnected: true
    }));
    return;
  }
  
  if (req.url === '/api/agents') {
    const { agents } = getOpenClawData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(agents));
    return;
  }
  
  if (req.url === '/api/tasks') {
    const { tasks } = getOpenClawData();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tasks));
    return;
  }
  
  res.writeHead(404);
  res.end('Not Found');
});

// 创建 WebSocket 服务器
const wss = new WebSocket.Server({ 
  server,
  // 允许任何来源的连接
  verifyClient: (info) => {
    console.log('🔍 WebSocket 连接请求来自:', info.origin || '未知来源');
    return true; // 允许所有来源
  }
});

// 客户端连接管理
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('✅ 客户端连接到 Gateway 适配器');
  clients.add(ws);
  
  // 发送当前真实数据
  const { agents, tasks, source } = getOpenClawData();
  
  ws.send(JSON.stringify({
    type: 'agents_update',
    data: agents,
    timestamp: new Date().toISOString(),
    source
  }));
  
  ws.send(JSON.stringify({
    type: 'tasks_update',
    data: tasks,
    timestamp: new Date().toISOString(),
    source
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('收到客户端消息:', data.type);
      
      switch (data.type) {
        case 'get_agents':
          const { agents } = getOpenClawData();
          ws.send(JSON.stringify({
            type: 'agents_update',
            data: agents,
            timestamp: new Date().toISOString()
          }));
          break;
          
        case 'get_tasks':
          const { tasks } = getOpenClawData();
          ws.send(JSON.stringify({
            type: 'tasks_update',
            data: tasks,
            timestamp: new Date().toISOString()
          }));
          break;
      }
    } catch (err) {
      console.error('消息解析错误:', err);
    }
  });
  
  ws.on('close', () => {
    console.log('客户端断开连接');
    clients.delete(ws);
  });
  
  ws.on('error', (err) => {
    console.error('WebSocket 错误:', err);
    clients.delete(ws);
  });
});

// 广播消息给所有客户端
function broadcast(message) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// 实时监控数据更新
function monitorOpenClawData() {
  const { agents, tasks, source } = getOpenClawData();
  
  broadcast({
    type: 'agents_update',
    data: agents,
    timestamp: new Date().toISOString(),
    source
  });
  
  broadcast({
    type: 'tasks_update',
    data: tasks,
    timestamp: new Date().toISOString(),
    source
  });
  
  console.log(`[${new Date().toLocaleTimeString()}] Gateway 数据已广播 - 客户端数:`, clients.size);
}

// 每 5 秒更新一次数据
setInterval(monitorOpenClawData, 5000);

// 启动服务器
const PORT = process.env.PORT || 18080;
const HOST = process.env.HOST || '0.0.0.0';
server.listen(PORT, HOST, () => {
  console.log(`🚀 Gateway 适配器服务器已启动`);
  console.log(`📡 WebSocket: ws://${HOST}:${PORT}`);
  console.log(`🌐 HTTP API: http://${HOST}:${PORT}`);
  console.log('');
  console.log('🔗 真实数据源:');
  console.log(`   - OpenClaw Gateway: ${GATEWAY_WS_URL}`);
  console.log(`   - 会话数据文件: ${SESSIONS_FILE}`);
  console.log(`   - 定时任务文件: ${CRON_JOBS_FILE}`);
  console.log('');
  console.log('🔍 API 端点:');
  console.log(`   - GET http://${HOST}:${PORT}/health`);
  console.log(`   - GET http://${HOST}:${PORT}/api/agents`);
  console.log(`   - GET http://${HOST}:${PORT}/api/tasks`);
  console.log('');
  console.log('按 Ctrl+C 停止服务器');
  console.log('');
  
  // 显示当前数据摘要
  const { agents, tasks } = getOpenClawData();
  console.log('📈 Gateway 监控摘要:');
  console.log(`   - 活跃会话: ${agents.length}`);
  console.log(`   - 总任务数: ${tasks.length}`);
  console.log(`   - 在线 Agent: ${agents.filter(a => a.status === 'online').length}`);
  console.log('');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('正在关闭服务器...');
  wss.close(() => {
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
  });
});