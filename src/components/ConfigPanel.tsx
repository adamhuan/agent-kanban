'use client';

import { useState, useEffect } from 'react';
import { X, Server, Wifi, WifiOff, Plus, Trash2, Edit2, Check, XCircle, RotateCcw, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ServerConfig } from '@/lib/websocket';

interface ConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  servers: ServerConfig[];
  activeServerId: string | null;
  onAddServer: (name: string, url: string) => void;
  onRemoveServer: (id: string) => void;
  onSwitchServer: (id: string) => void;
  onUpdateServer: (id: string, updates: Partial<ServerConfig>) => void;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

export default function ConfigPanel({ 
  isOpen, 
  onClose, 
  servers,
  activeServerId,
  onAddServer,
  onRemoveServer,
  onSwitchServer,
  onUpdateServer,
  connectionStatus
}: ConfigPanelProps) {
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('ws://localhost:18789');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowAddForm(false);
      setEditingId(null);
      setSaved(false);
    }
  }, [isOpen]);

  const handleAdd = () => {
    if (newServerName.trim() && newServerUrl.trim()) {
      onAddServer(newServerName.trim(), newServerUrl.trim());
      setNewServerName('');
      setNewServerUrl('ws://localhost:18789');
      setShowAddForm(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleEdit = (server: ServerConfig) => {
    setEditingId(server.id);
    setEditName(server.name);
    setEditUrl(server.url);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim() && editUrl.trim()) {
      onUpdateServer(editingId, { name: editName.trim(), url: editUrl.trim() });
      setEditingId(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditUrl('');
  };

  const handleSwitch = (id: string) => {
    if (id !== activeServerId) {
      onSwitchServer(id);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-100 text-green-700';
      case 'connecting': return 'bg-yellow-100 text-yellow-700';
      case 'disconnected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '已连接';
      case 'connecting': return '连接中...';
      case 'disconnected': return '已断开';
      default: return '未知';
    }
  };

  if (!isOpen) return null;

  const activeServer = servers.find(s => s.id === activeServerId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Server className="w-5 h-5 text-white mr-2" />
            <h2 className="text-lg font-semibold text-white">WebSocket 服务器配置</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 当前连接状态 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">当前连接</span>
              <div className={`flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor()}`}>
                {connectionStatus === 'connected' ? (
                  <><Wifi className="w-3 h-3 mr-1" /> {getStatusText()}</>
                ) : connectionStatus === 'connecting' ? (
                  <><Wifi className="w-3 h-3 mr-1 animate-pulse" /> {getStatusText()}</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" /> {getStatusText()}</>
                )}
              </div>
            </div>
            {activeServer && (
              <div className="text-sm">
                <div className="font-medium text-gray-900">{activeServer.name}</div>
                <div className="text-gray-500">{activeServer.url}</div>
              </div>
            )}
          </div>

          {/* 服务器列表 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                服务器列表 ({servers.length})
              </label>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {showAddForm ? (
                  <><ChevronUp className="w-4 h-4 mr-1" /> 收起</>
                ) : (
                  <><Plus className="w-4 h-4 mr-1" /> 添加</>
                )}
              </button>
            </div>

            {/* 添加表单 */}
            {showAddForm && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">服务器名称</label>
                  <input
                    type="text"
                    value={newServerName}
                    onChange={(e) => setNewServerName(e.target.value)}
                    placeholder="例如：生产环境"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">WebSocket URL</label>
                  <input
                    type="text"
                    value={newServerUrl}
                    onChange={(e) => setNewServerUrl(e.target.value)}
                    placeholder="ws://localhost:18789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={!newServerName.trim() || !newServerUrl.trim()}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    添加服务器
                  </button>
                </div>
              </div>
            )}

            {/* 服务器列表 */}
            <div className="space-y-2">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className={`border rounded-lg p-3 transition-all ${
                    server.id === activeServerId 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {editingId === server.id ? (
                    // 编辑模式
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="服务器名称"
                      />
                      <input
                        type="text"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="WebSocket URL"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <XCircle className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                        >
                          <Check className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 显示模式
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleSwitch(server.id)}
                      >
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${
                            server.id === activeServerId 
                              ? 'bg-green-500' 
                              : 'bg-gray-300'
                          }`} />
                          <div>
                            <div className="font-medium text-gray-900">{server.name}</div>
                            <div className="text-xs text-gray-500">{server.url}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {server.id === activeServerId && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                            当前
                          </span>
                        )}
                        <button
                          onClick={() => handleEdit(server)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {servers.length > 1 && (
                          <button
                            onClick={() => onRemoveServer(server.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 快速预设 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              快速添加预设
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setNewServerName('OpenClaw Gateway');
                  setNewServerUrl('ws://localhost:18080');
                  setShowAddForm(true);
                }}
                className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-blue-800 text-left border border-blue-300"
              >
                <div className="font-medium">🎯 本地 Gateway</div>
                <div className="text-xs text-blue-600">localhost:18080</div>
              </button>
              <button
                onClick={() => {
                  setNewServerName('Gateway (IP)');
                  setNewServerUrl(`ws://${typeof window !== 'undefined' ? window.location.hostname : '192.168.126.10'}:18080`);
                  setShowAddForm(true);
                }}
                className="px-3 py-2 text-sm bg-green-100 hover:bg-green-200 rounded-lg transition-colors text-green-800 text-left border border-green-300"
              >
                <div className="font-medium">🌐 IP 访问</div>
                <div className="text-xs text-green-600">{typeof window !== 'undefined' ? window.location.hostname : 'IP'}:18080</div>
              </button>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="bg-gray-50 px-6 py-3 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>配置自动保存到浏览器</span>
            {saved && (
              <span className="flex items-center text-green-600">
                <CheckCircle className="w-3 h-3 mr-1" /> 已保存
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}