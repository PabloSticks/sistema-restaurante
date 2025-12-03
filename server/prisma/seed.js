// server/prisma/seed.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando la siembra de datos (Prisma 5 Stable)...');

  // --- ADMIN ---
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@buensabor.com' },
    update: {},
    create: {
      nombre: 'Administrador General',
      email: 'admin@buensabor.com',
      password: passwordHash,
      rol: 'ADMIN',
    },
  });

  // --- COCINA ---
  await prisma.usuario.upsert({
    where: { email: 'cocina@buensabor.com' },
    update: {},
    create: {
      nombre: 'Jefe de Cocina',
      email: 'cocina@buensabor.com',
      password: await bcrypt.hash('cocina123', 10),
      rol: 'COCINA',
    },
  });

  // --- GARZON ---
  await prisma.usuario.upsert({
    where: { email: 'garzon@buensabor.com' },
    update: {},
    create: {
      nombre: 'Juan Garzón',
      email: 'garzon@buensabor.com',
      password: await bcrypt.hash('garzon123', 10),
      rol: 'GARZON',
    },
  });

  // --- MESAS ---
  for (let i = 1; i <= 10; i++) {
    await prisma.mesa.upsert({
      where: { numero: `M-${i}` },
      update: {},
      create: {
        numero: `M-${i}`,
        capacidad: 4,
        estado: 'libre'
      }
    });
  }

  // --- PRODUCTOS ---
  const productos = [
    { nombre: 'Coca Cola', precio: 2500, categoria: 'bebida', estacion: 'barra' },
    { nombre: 'Lomo a lo Pobre', precio: 8900, categoria: 'plato_fondo', estacion: 'cocina_caliente' },
    { nombre: 'Ceviche Mixto', precio: 7500, categoria: 'plato_fondo', estacion: 'cocina_fria' },
    { nombre: 'Tiramisú', precio: 4500, categoria: 'postre', estacion: 'barra' },
  ];

  for (const p of productos) {
    const existe = await prisma.producto.findFirst({ where: { nombre: p.nombre }});
    if (!existe) {
        await prisma.producto.create({ data: p });
    }
  }
  
  console.log('🏁 Seeding completado con éxito.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });