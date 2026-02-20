// WebSocket 连接管理 - 支持多服务器配置
import { Task, Agent } from '@/types';

// 检测当前主机
function getDefaultWsUrl(): string {
  if (typeof window === 'undefined') return 'ws://localhost:18080';
  
  // 如果通过 IP 访问，使用相同 IP 连接 WebSocket
  const hostname = window.location.hostname;
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `ws://${hostname}:18080`;
  }
  return 'ws://localhost:18080';
}

const STORAGE_KEY = 'openclaw_monitor_config_v4';

export interface ServerConfig {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
}

interface StoredConfig {
  servers: ServerConfig[];
  activeServerId: string | null;
}

// 默认配置
function getDefaultConfig(): StoredConfig {
  const wsUrl = getDefaultWsUrl();
  const serverName = wsUrl.includes('localhost') ? 'OpenClaw Gateway' : `Gateway (${window.location.hostname})`;
  
  const defaultServer: ServerConfig = {
    id: 'gateway',
    name: serverName,
    url: wsUrl,
    isActive: true
  };
  return {
    servers: [defaultServer],
    activeServerId: 'gateway'
  };
}

// 从本地存储读取配置
function getStoredConfig(): StoredConfig {
  if (typeof window === 'undefined') return getDefaultConfig();
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      // 迁移旧配置
      if (config.url && !config.servers) {
        const server: ServerConfig = {
          id: 'default',
          name: '默认服务器',
          url: config.url,
          isActive: true
        };
        return {
          servers: [server],
          activeServerId: 'default'
        };
      }
      return config;
    }
  } catch (err) {
    console.error('读取配置失败:', err);
  }
  return getDefaultConfig();
}

// 保存配置到本地存储
function saveConfig(config: StoredConfig) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('保存配置失败:', err);
  }
}

export class OpenClawMonitor {
  private ws: WebSocket | null = null;
  private servers: ServerConfig[];
  private activeServerId: string | null;
  private reconnectInterval: number = 5000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnected: boolean = false;
  private connectionStatusListeners: Set<(status: 'connected' | 'disconnected' | 'connecting') => void> = new Set();

  constructor() {
    const config = getStoredConfig();
    this.servers = config.servers;
    this.activeServerId = config.activeServerId;
    this.connect();
  }

  private getActiveServer(): ServerConfig | null {
    if (!this.activeServerId) return this.servers[0] || null;
    return this.servers.find(s => s.id === this.activeServerId) || this.servers[0] || null;
  }

  private connect() {
    const server = this.getActiveServer();
    if (!server) {
      console.error('❌ 没有可用的服务器配置');
      this.emitConnectionStatus('disconnected');
      return;
    }

    try {
      // 如果已有连接，先关闭
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.emitConnectionStatus('connecting');
      console.log(`🔄 正在连接 WebSocket: ${server.url} (${server.name})`);
      
      // 创建 WebSocket 连接
      this.ws = new WebSocket(server.url);

      this.ws.onopen = () => {
        console.log(`✅ WebSocket 连接成功: ${server.name}`);
        this.isConnected = true;
        this.reconnectInterval = 5000; // 重置重连间隔
        this.emitConnectionStatus('connected');
        this.emit('connection', { status: 'connected', server });
        
        // 请求初始数据
        this.send({ type: 'get_agents' });
        this.send({ type: 'get_tasks' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          switch (message.type) {
            case 'agents_update':
              this.emit('agents', message.data);
              break;
            case 'tasks_update':
              this.emit('tasks', message.data);
              break;
            case 'agent_status_change':
              this.emit('agent_change', message.data);
              break;
          }
        } catch (err) {
          console.error('❌ 消息解析错误:', err);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`⚠️ WebSocket 连接断开 (code: ${event.code}, reason: ${event.reason || '无'})`);
        this.isConnected = false;
        this.emitConnectionStatus('disconnected');
        this.emit('connection', { status: 'disconnected' });
        
        // 只有非正常关闭才重连
        if (event.code !== 1000 && event.code !== 1001) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error);
        // 错误后连接会自动关闭，触发 onclose
      };
    } catch (err) {
      console.error('❌ 创建连接失败:', err);
      this.emitConnectionStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    
    console.log(`⏰ ${this.reconnectInterval / 1000}秒后尝试重连...`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.reconnectInterval);
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // 获取所有服务器配置
  getServers(): ServerConfig[] {
    return [...this.servers];
  }

  // 获取当前活动服务器
  getActiveServerConfig(): ServerConfig | null {
    return this.getActiveServer();
  }

  // 添加新服务器
  addServer(name: string, url: string): ServerConfig {
    const newServer: ServerConfig = {
      id: `server-${Date.now()}`,
      name,
      url,
      isActive: false
    };
    
    this.servers.push(newServer);
    saveConfig({ servers: this.servers, activeServerId: this.activeServerId });
    
    return newServer;
  }

  // 删除服务器
  removeServer(serverId: string): boolean {
    if (this.servers.length <= 1) {
      console.error('至少需要保留一个服务器');
      return false;
    }
    
    this.servers = this.servers.filter(s => s.id !== serverId);
    
    // 如果删除的是当前活动服务器，切换到第一个
    if (this.activeServerId === serverId) {
      this.activeServerId = this.servers[0]?.id || null;
      this.connect();
    }
    
    saveConfig({ servers: this.servers, activeServerId: this.activeServerId });
    return true;
  }

  // 切换活动服务器
  switchServer(serverId: string): boolean {
    const server = this.servers.find(s => s.id === serverId);
    if (!server) {
      console.error('服务器不存在:', serverId);
      return false;
    }
    
    if (this.activeServerId === serverId) {
      return true; // 已经是当前服务器
    }
    
    this.activeServerId = serverId;
    saveConfig({ servers: this.servers, activeServerId: this.activeServerId });
    
    // 重新连接
    this.connect();
    return true;
  }

  // 更新服务器配置
  updateServer(serverId: string, updates: Partial<ServerConfig>): boolean {
    const index = this.servers.findIndex(s => s.id === serverId);
    if (index === -1) return false;
    
    this.servers[index] = { ...this.servers[index], ...updates };
    saveConfig({ servers: this.servers, activeServerId: this.activeServerId });
    
    // 如果更新的是当前活动服务器，重新连接
    if (this.activeServerId === serverId && updates.url) {
      this.connect();
    }
    
    return true;
  }

  // 订阅事件
  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  // 订阅连接状态变化
  onConnectionStatus(callback: (status: 'connected' | 'disconnected' | 'connecting') => void) {
    this.connectionStatusListeners.add(callback);
    callback(this.isConnected ? 'connected' : (this.reconnectTimer ? 'connecting' : 'disconnected'));
    
    return () => {
      this.connectionStatusListeners.delete(callback);
    };
  }

  private emitConnectionStatus(status: 'connected' | 'disconnected' | 'connecting') {
    this.connectionStatusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (err) {
        console.error('连接状态回调错误:', err);
      }
    });
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error('事件处理错误:', err);
      }
    });
  }

  // 获取连接状态
  getConnectionStatus() {
    const server = this.getActiveServer();
    return {
      isConnected: this.isConnected,
      url: server?.url || '',
      serverName: server?.name || '',
      status: this.isConnected ? 'connected' : (this.reconnectTimer ? 'connecting' : 'disconnected')
    };
  }

  // 断开连接
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
  }
}

// 单例实例
let monitorInstance: OpenClawMonitor | null = null;

export function getOpenClawMonitor(): OpenClawMonitor {
  if (!monitorInstance) {
    monitorInstance = new OpenClawMonitor();
  }
  return monitorInstance;
}

// 重置实例
export function resetOpenClawMonitor(): OpenClawMonitor {
  if (monitorInstance) {
    monitorInstance.disconnect();
  }
  monitorInstance = new OpenClawMonitor();
  return monitorInstance;
}