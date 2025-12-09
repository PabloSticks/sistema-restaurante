// server/prisma/seed.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando Semilla "Chilena Recargada"...');

  // --------------------------------------------------------
  // 1. LIMPIEZA DE DATOS (Borrar lo antiguo)
  // --------------------------------------------------------
  console.log('🧹 Limpiando base de datos...');
  
  // Borramos en orden inverso para no romper relaciones (Foreign Keys)
  await prisma.detallePedido.deleteMany({});
  await prisma.pedido.deleteMany({});
  await prisma.mesa.deleteMany({});
  await prisma.producto.deleteMany({});
  // No borramos usuarios para no perder tu acceso admin/garzon
  
  // --------------------------------------------------------
  // 2. CREACIÓN DE USUARIOS (Si no existen)
  // --------------------------------------------------------
  const passwordHash = await bcrypt.hash('admin123', 10);
  const passGarzon = await bcrypt.hash('garzon123', 10);
  const passCocina = await bcrypt.hash('cocina123', 10);

  await prisma.usuario.upsert({
    where: { email: 'admin@buensabor.com' },
    update: {},
    create: { nombre: 'Admin General', email: 'admin@buensabor.com', password: passwordHash, rol: 'ADMIN' },
  });

  await prisma.usuario.upsert({
    where: { email: 'garzon@buensabor.com' },
    update: {},
    create: { nombre: 'Juan Garzón', email: 'garzon@buensabor.com', password: passGarzon, rol: 'GARZON' },
  });

  await prisma.usuario.upsert({
    where: { email: 'cocina@buensabor.com' },
    update: {},
    create: { nombre: 'Jefe Cocina', email: 'cocina@buensabor.com', password: passCocina, rol: 'COCINA' },
  });

  // --------------------------------------------------------
  // 3. CREACIÓN DE 60 MESAS
  // --------------------------------------------------------
  console.log('🪑 Construyendo 60 mesas...');
  const mesasData = [];
  for (let i = 1; i <= 60; i++) {
    mesasData.push({
      numero: `M-${i}`,
      // Variamos la capacidad para darle realismo
      capacidad: i <= 10 ? 2 : i <= 40 ? 4 : 6, 
      estado: 'libre'
    });
  }
  await prisma.mesa.createMany({ data: mesasData });

  // --------------------------------------------------------
  // 4. CREACIÓN DE PRODUCTOS (Menú Típico Chileno)
  // --------------------------------------------------------
  console.log('🍲 Cocinando menú chileno...');

  const menuChileno = [
    // --- 5 ENTRADAS ---
    { nombre: 'Empanada de Pino', precio: 2500, categoria: 'entrada', estacion: 'cocina_caliente' },
    { nombre: 'Sopaipillas con Pebre (4 un)', precio: 3500, categoria: 'entrada', estacion: 'cocina_caliente' },
    { nombre: 'Palta Reina', precio: 4800, categoria: 'entrada', estacion: 'cocina_fria' },
    { nombre: 'Machas a la Parmesana', precio: 8900, categoria: 'entrada', estacion: 'cocina_caliente' },
    { nombre: 'Arrollado Huaso', precio: 5500, categoria: 'entrada', estacion: 'cocina_fria' },

    // --- 10 PLATOS DE FONDO ---
    { nombre: 'Pastel de Choclo', precio: 8500, categoria: 'plato_fondo', estacion: 'cocina_caliente' },
    { nombre: 'Cazuela de Vacuno', precio: 7900, categoria: 'plato_fondo', estacion: 'cocina_caliente' },
    { nombre: 'Lomo a lo Pobre', precio: 11500, categoria: 'plato_fondo', estacion: 'cocina_caliente' },
    { nombre: 'Charquicán con Huevo', precio: 6900, categoria: 'plato_fondo', estacion: 'cocina_caliente' },
    { nombre: 'Porotos con Riendas', precio: 6500, categoria: 'plato_fondo', estacion: 'cocina_caliente' },
    { nombre: 'Costillar con Puré Picante', precio: 9800, categoria: 'plato_fondo', estacion: 'cocina_caliente' },
    { nombre: 'Paila Marina', precio: 9500, categoria: 'plato_fondo', estacion: 'cocina_caliente' },
    { nombre: 'Merluza Frita con Chilena', precio: 7800, categoria: 'plato_fondo', estacion: 'cocina_caliente' },
    { nombre: 'Chorrillana (Para 2)', precio: 13500, categoria: 'plato_fondo', estacion: 'cocina_caliente' },
    { nombre: 'Plateada al Jugo c/ Agregado', precio: 10500, categoria: 'plato_fondo', estacion: 'cocina_caliente' },

    // --- 5 POSTRES ---
    { nombre: 'Mote con Huesillo', precio: 2500, categoria: 'postre', estacion: 'postre' }, // Usamos 'postre' o 'cocina_fria' según tu lógica
    { nombre: 'Leche Asada', precio: 3200, categoria: 'postre', estacion: 'postre' },
    { nombre: 'Sémola con Leche', precio: 2800, categoria: 'postre', estacion: 'postre' },
    { nombre: 'Alfajor Chileno', precio: 1500, categoria: 'postre', estacion: 'postre' },
    { nombre: 'Panqueque Celestino', precio: 3800, categoria: 'postre', estacion: 'postre' },

    // --- 5 BEBIDAS ---
    { nombre: 'Coca-cola 350cc', precio: 4500, categoria: 'bebida', estacion: 'barra' },
    { nombre: 'Fanta 350cc', precio: 4000, categoria: 'bebida', estacion: 'barra' },
    { nombre: 'Sprite 350cc', precio: 15000, categoria: 'bebida', estacion: 'barra' },
    { nombre: 'Jugo Natural Frambuesa', precio: 3500, categoria: 'bebida', estacion: 'barra' },
    { nombre: 'Jugo Natural Piña', precio: 2000, categoria: 'bebida', estacion: 'barra' },
  ];

  await prisma.producto.createMany({ data: menuChileno });

  console.log('✅ ¡Seed completado! Restaurante listo para operar.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });