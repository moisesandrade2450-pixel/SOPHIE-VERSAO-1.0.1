const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Middleware de segurança
const rateLimit = require('express-rate-limit');

// Rate limiting para proteger contra ataques
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP
  message: 'Muitas requisições. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Middleware de autenticação para endpoints protegidos
const autenticarAdmin = (req, res, next) => {
  const token = req.headers['authorization'];
  const sessaoId = req.headers['x-session-id'];
  
  // Para endpoints públicos, permitir acesso
  if (req.path.includes('/avisos/') && req.method === 'GET') {
    return next();
  }
  
  // Verificar autenticação para endpoints protegidos
  if (!sessaoId) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }
  
  // Aqui você verificaria a sessão no sistema de admin
  // Por enquanto, vamos simular uma verificação básica
  if (sessaoId && sessaoId.startsWith('sess_')) {
    req.adminSession = { sessaoId, role: 'admin' };
    next();
  } else {
    res.status(401).json({ error: 'Sessão inválida' });
  }
};

// Armazenamento em memória para dados SOPHIE
let sophieData = {};

// API REST para compatibilidade
app.get('/api/avisos/:salaId', (req, res) => {
  const { salaId } = req.params;
  res.json(sophieData[salaId] || {});
});

app.post('/api/avisos/:salaId', (req, res) => {
  const { salaId } = req.params;
  const data = req.body;

  if (!sophieData[salaId]) {
    sophieData[salaId] = {};
  }

  const key = Date.now().toString();
  sophieData[salaId][key] = { ...data, id: key, timestamp: new Date().toISOString() };

  // Broadcast via Socket.IO
  io.emit(`aviso-${salaId}`, sophieData[salaId][key]);

  res.json({ success: true, key });
});

// Endpoints protegidos de administração
app.get('/api/admin/stats', autenticarAdmin, (req, res) => {
  const stats = {
    totalAvisos: Object.values(sophieData).reduce((total, sala) => total + Object.keys(sala).length, 0),
    salasAtivas: Object.keys(sophieData).length,
    conexoesAtivas: io.engine.clientsCount,
    uptime: process.uptime()
  };
  res.json(stats);
});

app.get('/api/admin/logs', autenticarAdmin, (req, res) => {
  // Simulação de logs - em produção, viria de um sistema de logging
  const logs = [
    { timestamp: new Date().toISOString(), level: 'info', message: 'Sistema operacional' },
    { timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', message: 'Acesso administrativo verificado' }
  ];
  res.json(logs);
});

app.delete('/api/admin/limpar-dados', autenticarAdmin, (req, res) => {
  if (req.adminSession.role !== 'super_admin') {
    return res.status(403).json({ error: 'Apenas Super Admin pode limpar dados' });
  }
  
  sophieData = {};
  res.json({ success: true, message: 'Dados limpos com sucesso' });
});

app.get('/api/admin/sessoes', autenticarAdmin, (req, res) => {
  // Simulação de sessões ativas
  const sessoes = [
    { id: 'sess_123', usuario: 'cristian', role: 'super_admin', criadoEm: new Date().toISOString() }
  ];
  res.json(sessoes);
});

// Socket.IO para comunicação em tempo real
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  socket.on('join-sala', (salaId) => {
    socket.join(`sala-${salaId}`);
    console.log(`Cliente ${socket.id} entrou na sala ${salaId}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor SOPHIE rodando na porta ${PORT}`);
  console.log(`📡 Acesse de outros dispositivos usando: http://SEU_IP:${PORT}`);
  console.log(`🌐 IP local: ${getLocalIP()}:${PORT}`);
});

function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}