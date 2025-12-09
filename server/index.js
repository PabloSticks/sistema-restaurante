// server/index.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';

// --- 1. IMPORTAR RUTAS ---
import authRoutes from './src/routes/auth.routes.js';
import userRoutes from './src/routes/user.routes.js'; 
import mesaRoutes from './src/routes/mesa.routes.js'; 
import productoRoutes from './src/routes/producto.routes.js';
import turnoRoutes from './src/routes/turno.routes.js';
import pedidoRoutes from './src/routes/pedido.routes.js';
import cocinaRoutes from './src/routes/cocina.routes.js';
import statsRoutes from './src/routes/stats.routes.js';

// --- 2. INICIALIZAR APP Y SERVER ---
const app = express();
const httpServer = createServer(app); // Creamos el server HTTP
const PORT = process.env.PORT || 3000;

// --- 3. CONFIGURACIÓN SOCKET.IO (¡ANTES DE LAS RUTAS!) ---
const io = new SocketServer(httpServer, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

// --- 4. MIDDLEWARES ---
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true 
}));
app.use(morgan('dev'));
app.use(express.json());

// ★ MIDDLEWARE CLAVE: Inyectar 'io' en cada petición ★
// Esto permite que los controladores hagan: req.io.emit(...)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- 5. USAR RUTAS ---
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mesas', mesaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/turnos', turnoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/cocina', cocinaRoutes); 
app.use('/api/stats', statsRoutes);


// --- 6. EVENTOS DE SOCKET ---
io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);
  
  // NUEVO: El cliente nos dice quién es y lo metemos en su sala privada
  socket.on('join_user_room', (userId) => {
    const roomName = `user_${userId}`;
    socket.join(roomName);
    console.log(`Socket ${socket.id} se unió a la sala: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Ruta base de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API Restaurante Buen Sabor - Funcionando 🚀' });
});

// --- 7. ARRANCAR SERVIDOR ---
httpServer.listen(PORT, () => {
  console.log(`Server corriendo en http://localhost:${PORT}`);
});