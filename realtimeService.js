// Serviço de comunicação em tempo real entre computadores
// Suporta WebSocket, Socket.io e fallback para polling

import { useState, useEffect } from 'react';
import { playNotificationSound, speak } from './audioService';

class RealtimeService {
  constructor() {
    this.connections = new Map();
    this.rooms = new Map();
    this.messageQueue = [];
    this.isOnline = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    
    // Configurações
    this.config = {
      wsUrl: process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
      roomId: null,
      userId: null,
      userName: null,
      userRole: null,
    };
    
    // Event listeners
    this.listeners = {
      message: [],
      connection: [],
      error: [],
      roomJoined: [],
      userJoined: [],
      userLeft: [],
    };
  }

  // Inicializar serviço
  async initialize(config = {}) {
    this.config = { ...this.config, ...config };
    
    if (!this.config.userId || !this.config.userName) {
      throw new Error('userId e userName são obrigatórios');
    }

    // Tentar WebSocket primeiro
    if (this.tryWebSocket()) {
      return true;
    }
    
    // Fallback para EventSource (Server-Sent Events)
    if (this.tryEventSource()) {
      return true;
    }
    
    // Último recurso: polling
    return this.tryPolling();
  }

  // Tentar conexão WebSocket
  tryWebSocket() {
    try {
      if (typeof WebSocket === 'undefined') {
        return false;
      }

      this.ws = new WebSocket(this.config.wsUrl);
      
      this.ws.onopen = () => {
        console.log('WebSocket conectado');
        this.isOnline = true;
        this.reconnectAttempts = 0;
        this.emit('connection', { type: 'connected', method: 'websocket' });
        this.processMessageQueue();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket desconectado');
        this.isOnline = false;
        this.emit('connection', { type: 'disconnected', method: 'websocket' });
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Erro WebSocket:', error);
        this.emit('error', { type: 'websocket_error', error });
      };

      return true;
    } catch (error) {
      console.warn('WebSocket não disponível:', error);
      return false;
    }
  }

  // Tentar EventSource (Server-Sent Events)
  tryEventSource() {
    try {
      if (typeof EventSource === 'undefined') {
        return false;
      }

      this.eventSource = new EventSource(`${this.config.apiUrl}/events`);
      
      this.eventSource.onopen = () => {
        console.log('EventSource conectado');
        this.isOnline = true;
        this.emit('connection', { type: 'connected', method: 'events' });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Erro ao processar mensagem EventSource:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('Erro EventSource:', error);
        this.emit('error', { type: 'events_error', error });
      };

      return true;
    } catch (error) {
      console.warn('EventSource não disponível:', error);
      return false;
    }
  }

  // Fallback para polling
  tryPolling() {
    console.log('Usando polling como fallback');
    this.isOnline = true;
    
    this.pollingInterval = setInterval(() => {
      this.fetchMessages();
    }, 3000); // Poll a cada 3 segundos

    this.emit('connection', { type: 'connected', method: 'polling' });
    return true;
  }

  // Processar mensagens recebidas
  handleMessage(data) {
    console.log('Mensagem recebida:', data);

    // Reproduzir som de notificação
    if (data.type === 'message' || data.type === 'announcement') {
      playNotificationSound();
      
      // Falar mensagem se for anúncio importante
      if (data.type === 'announcement' && data.priority === 'high') {
        speak(`Novo comunicado: ${data.message}`);
      }
    }

    // Emitir para listeners
    this.emit('message', data);
    
    // Eventos específicos
    switch (data.type) {
      case 'roomJoined':
        this.emit('roomJoined', data);
        break;
      case 'userJoined':
        this.emit('userJoined', data);
        break;
      case 'userLeft':
        this.emit('userLeft', data);
        break;
    }
  }

  // Enviar mensagem
  async sendMessage(message, options = {}) {
    const messageData = {
      id: Date.now().toString(),
      userId: this.config.userId,
      userName: this.config.userName,
      userRole: this.config.userRole,
      roomId: this.config.roomId,
      message: message,
      type: options.type || 'message',
      priority: options.priority || 'normal',
      timestamp: new Date().toISOString(),
      ...options
    };

    if (this.isOnline) {
      return this.sendToServer(messageData);
    } else {
      // Adicionar à fila se offline
      this.messageQueue.push(messageData);
      return false;
    }
  }

  // Enviar para servidor
  async sendToServer(data) {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(data));
        return true;
      }

      // Fallback HTTP
      const response = await fetch(`${this.config.apiUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      this.messageQueue.push(data);
      return false;
    }
  }

  // Entrar em sala
  async joinRoom(roomId) {
    this.config.roomId = roomId;
    
    return this.sendMessage('joined_room', {
      type: 'roomJoined',
      roomId: roomId,
    });
  }

  // Sair da sala
  async leaveRoom() {
    const result = await this.sendMessage('left_room', {
      type: 'roomLeft',
      roomId: this.config.roomId,
    });
    
    this.config.roomId = null;
    return result;
  }

  // Enviar anúncio (diretora/admin)
  async sendAnnouncement(message, priority = 'normal', targetRooms = [], extraOptions = {}) {
    return this.sendMessage(message, {
      type: 'announcement',
      priority: priority,
      targetRooms: targetRooms,
      isAnnouncement: true,
      ...extraOptions,
    });
  }

  // Buscar mensagens via polling
  async fetchMessages() {
    try {
      const response = await fetch(`${this.config.apiUrl}/messages/${this.config.roomId}`);
      if (response.ok) {
        const messages = await response.json();
        messages.forEach(msg => this.handleMessage(msg));
      }
    } catch (error) {
      console.error('Erro no polling:', error);
    }
  }

  // Processar fila de mensagens
  processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendToServer(message);
    }
  }

  // Tentar reconexão
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Máximo de tentativas de reconexão atingido');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Tentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.tryWebSocket();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Sistema de eventos
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  // Testar áudio em múltiplos computadores
  async testAudioSystem(testMessage = 'Teste de áudio do sistema SOPHIE') {
    console.log('Iniciando teste de sistema de áudio...');
    
    // Enviar mensagem de teste
    await this.sendAnnouncement(testMessage, 'high');
    
    // Reproduzir som de teste
    await playNotificationSound();
    
    // Falar mensagem de teste
    await speak(testMessage);
    
    return {
      success: true,
      message: 'Teste de áudio iniciado',
      timestamp: new Date().toISOString(),
    };
  }

  // Verificar status da conexão
  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      method: this.ws ? 'websocket' : this.eventSource ? 'events' : 'polling',
      roomId: this.config.roomId,
      userId: this.config.userId,
      queuedMessages: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  // Limpar recursos
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.eventSource) {
      this.eventSource.close();
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    this.isOnline = false;
    this.messageQueue = [];
  }
}

// Instância global
export const realtimeService = new RealtimeService();

// Hook para React
export const useRealtime = (config) => {
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Inicializar serviço
    realtimeService.initialize(config);

    // Listeners
    const handleConnection = (status) => {
      setConnectionStatus(status);
    };

    const handleMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    realtimeService.on('connection', handleConnection);
    realtimeService.on('message', handleMessage);

    return () => {
      realtimeService.off('connection', handleConnection);
      realtimeService.off('message', handleMessage);
      realtimeService.disconnect();
    };
  }, [config]);

  return {
    connectionStatus,
    messages,
    sendMessage: realtimeService.sendMessage.bind(realtimeService),
    joinRoom: realtimeService.joinRoom.bind(realtimeService),
    leaveRoom: realtimeService.leaveRoom.bind(realtimeService),
    sendAnnouncement: realtimeService.sendAnnouncement.bind(realtimeService),
    testAudioSystem: realtimeService.testAudioSystem.bind(realtimeService),
    getConnectionStatus: realtimeService.getConnectionStatus.bind(realtimeService),
  };
};

export default RealtimeService;
