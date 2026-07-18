// Importación de dependencias principales
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Importación de módulos propios
const { conectarDB } = require('./db/conexion');
const authRoutes = require('./routes/auth');

// Inicialización de Express y servidor HTTP
const app = express();
const server = http.createServer(app);

// Configuración de Socket.IO permitiendo conexiones desde cualquier origen
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas de autenticación
app.use('/api/auth', authRoutes);

// Almacén de pedidos en memoria
let pedidos = [];

// Eventos de Socket.IO
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Envía los pedidos actuales al nuevo cliente conectado
  socket.emit('pedidos_actuales', pedidos);

  // Evento: mozo envía un nuevo pedido
  socket.on('nuevo_pedido', async (pedido) => {
    // Agrega id, estado y hora al pedido
    pedido.id = Date.now().toString();
    pedido.estado = 'pendiente';
    pedido.timestamp = new Date().toISOString();
    pedidos.push(pedido);

    // Notifica a todos los clientes conectados del nuevo pedido
    io.emit('pedido_recibido', pedido);
    console.log('Nuevo pedido:', pedido);
  });

  // Evento: cocinero actualiza el estado de un pedido
  socket.on('actualizar_estado', async ({ pedidoId, estado }) => {
    // Busca y actualiza el pedido en el arreglo
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      pedido.estado = estado;

      // Notifica a todos del cambio de estado
      io.emit('estado_actualizado', { pedidoId, estado });
      console.log(`Pedido ${pedidoId} → ${estado}`);
    }
  });

  // Evento: cliente se desconecta
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});

// Conecta a MongoDB y luego inicia el servidor
const PORT = process.env.PORT || 3000;

const iniciar = async () => {
  await conectarDB();
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
};

iniciar();