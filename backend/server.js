const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const { conectarDB } = require('./db/conexion');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  // Configuración para mantener conexión estable
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());

// Health check para que Render no duerma el servidor
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes);

let pedidos = [];

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Envía los pedidos actuales al nuevo cliente
  socket.emit('pedidos_actuales', pedidos);

  socket.on('nuevo_pedido', async (pedido) => {
    pedido.id = Date.now().toString();
    pedido.estado = 'pendiente';
    pedido.timestamp = new Date().toISOString();
    pedidos.push(pedido);
    io.emit('pedido_recibido', pedido);
    console.log('Nuevo pedido:', pedido);
  });

  socket.on('actualizar_estado', async ({ pedidoId, estado }) => {
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      pedido.estado = estado;
      io.emit('estado_actualizado', { pedidoId, estado });
      console.log(`Pedido ${pedidoId} → ${estado}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;

const iniciar = async () => {
  await conectarDB();
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
};

iniciar();