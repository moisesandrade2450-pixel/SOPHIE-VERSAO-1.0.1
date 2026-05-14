// Servidor de comunicação em tempo real para SOPHIE
// Suporta WebSocket, HTTP e EventSource

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuração
const PORT = process.env.PORT || 3001;
const API_PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Armazenamento em memória (em produção usar Redis/Database)
const rooms = new Map();
const connections = new Map();
const messages = [];

// Classe Room
class Room {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.users = new Set();
    this.messages = [];
  }

  addUser(userId) {
    this.users.add(userId);
  }

  removeUser(userId) {
    this.users.delete(userId);
  }

  addMessage(message) {
    this.messages.push(message);
    // Manter apenas últimas 100 mensagens
    if (this.messages.length > 100) {
      this.messages.shift();
    }
  }
}

// WebSocket Server
wss.on('connection', (ws, req) => {
  console.log('Nova conexão WebSocket');
  
  let userId = null;
  let roomId = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'join':
          userId = message.userId;
          roomId = message.roomId;
          
          // Entrar na sala
          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Room(roomId, `Sala ${roomId}`));
          }
          
          const room = rooms.get(roomId);
          room.addUser(userId);
          
          // Armazenar conexão
          connections.set(userId, { ws, roomId, user: message.user });
          
          // Enviar histórico de mensagens
          ws.send(JSON.stringify({
            type: 'history',
            messages: room.messages,
            users: Array.from(room.users),
          }));
          
          // Notificar outros usuários
          broadcast(roomId, {
            type: 'userJoined',
            user: message.user,
            users: Array.from(room.users),
          }, userId);
          
          break;
          
        case 'message':
        case 'announcement': {
          const messageData = {
            ...message,
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
          };
          
          // Adicionar ao histórico
          if (roomId && rooms.has(roomId)) {
            rooms.get(roomId).addMessage(messageData);
          }
          
          messages.push(messageData);
          
          // Broadcast para sala específica ou todas
          if (message.targetRooms && message.targetRooms.length > 0) {
            message.targetRooms.forEach(targetRoom => {
              broadcast(targetRoom, messageData);
            });
          } else if (roomId) {
            broadcast(roomId, messageData);
          } else {
            broadcastAll(messageData);
          }
          
          // Log para auditoria
          console.log(`[${new Date().toISOString()}] ${message.userRole} ${message.userName}: ${message.message}`);
          
          break;
          
        case 'leave':
          if (userId && roomId && rooms.has(roomId)) {
            rooms.get(roomId).removeUser(userId);
            connections.delete(userId);
            
            broadcast(roomId, {
              type: 'userLeft',
              userId: userId,
              users: Array.from(rooms.get(roomId).users),
            });
          }
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('Erro ao processar mensagem WebSocket:', error);
    }
  });

  ws.on('close', () => {
    console.log('Conexão WebSocket fechada');
    
    if (userId && roomId && rooms.has(roomId)) {
      rooms.get(roomId).removeUser(userId);
      connections.delete(userId);
      
      broadcast(roomId, {
        type: 'userLeft',
        userId: userId,
        users: Array.from(rooms.get(roomId).users),
      });
    }
  });

  ws.on('error', (error) => {
    console.error('Erro WebSocket:', error);
  });
});

// Funções de broadcast
function broadcast(roomId, message, excludeUserId = null) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.users.forEach(userId => {
    if (userId !== excludeUserId) {
      const connection = connections.get(userId);
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(JSON.stringify(message));
      }
    }
  });
}

function broadcastAll(message) {
  connections.forEach((connection, userId) => {
    if (connection.ws.readyState === WebSocket.OPEN) {
      connection.ws.send(JSON.stringify(message));
    }
  });
}

// Rotas HTTP API
app.post('/message', (req, res) => {
  const message = {
    ...req.body,
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
  };

  messages.push(message);

  // Broadcast via WebSocket
  if (message.roomId && rooms.has(message.roomId)) {
    rooms.get(message.roomId).addMessage(message);
    broadcast(message.roomId, message);
  } else {
    broadcastAll(message);
  }

  res.json({ success: true, messageId: message.id });
});

app.get('/messages/:roomId?', (req, res) => {
  const roomId = req.params.roomId;
  
  if (roomId && rooms.has(roomId)) {
    res.json(rooms.get(roomId).messages);
  } else {
    res.json(messages);
  }
});

app.get('/rooms', (req, res) => {
  const roomList = Array.from(rooms.values()).map(room => ({
    id: room.id,
    name: room.name,
    userCount: room.users.size,
    lastActivity: room.messages.length > 0 ? 
      room.messages[room.messages.length - 1].timestamp : null,
  }));
  res.json(roomList);
});

app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    connections: connections.size,
    rooms: rooms.size,
    totalMessages: messages.length,
    uptime: process.uptime(),
  });
});

// Server-Sent Events endpoint
app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const roomId = req.query.roomId;
  
  // Enviar status inicial
  res.write(`data: ${JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString(),
  })}\n\n`);

  // Manter conexão viva
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({
      type: 'heartbeat',
      timestamp: new Date().toISOString(),
    })}\n\n`);
  }, 30000);

  // Listener para novas mensagens
  const messageListener = (message) => {
    if (!roomId || message.roomId === roomId || !message.roomId) {
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    }
  };

  // Simular listener (em produção usar EventEmitter)
  global.eventListeners = global.eventListeners || [];
  global.eventListeners.push(messageListener);

  req.on('close', () => {
    clearInterval(heartbeat);
    const index = global.eventListeners.indexOf(messageListener);
    if (index > -1) {
      global.eventListeners.splice(index, 1);
    }
  });
});

// Servir aplicação React em produção
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor SOPHIE rodando na porta ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌐 HTTP API: http://localhost:${PORT}`);
  console.log(`📊 Status: http://localhost:${PORT}/status`);
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('Erro não capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejeição não tratada:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

module.exports = { app, server, wss };
