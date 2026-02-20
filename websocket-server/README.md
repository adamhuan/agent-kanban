# OpenClaw Agent Monitor WebSocket Server

这是一个 WebSocket 服务器，用于实时监控 OpenClaw 中的 Agent 状态。

## 安装依赖

```bash
cd websocket-server
npm install
```

## 启动服务器

```bash
npm start
```

服务器将在 ws://localhost:8080 运行

## API 端点

### WebSocket 事件

**客户端 → 服务器:**
- `subscribe` - 订阅实时更新
- `get_agents` - 获取当前所有 Agent
- `get_tasks` - 获取当前所有任务

**服务器 → 客户端:**
- `agents_update` - Agent 状态更新
- `tasks_update` - 任务状态更新
- `agent_status_change` - 单个 Agent 状态变更

## 数据格式

### Agent 状态
```json
{
  "id": "agent:main:main",
  "name": "龙虾机器人 🦞",
  "status": "online",
  "currentTask": "Harbor 部署",
  "tasksCompleted": 42,
  "lastActive": "2026-02-20T23:15:00Z"
}
```

### 任务状态
```json
{
  "id": "task-1",
  "title": "Harbor HA 部署",
  "status": "in_progress",
  "agentId": "agent:main:main",
  "progress": 65,
  "updatedAt": "2026-02-20T23:15:00Z"
}
```