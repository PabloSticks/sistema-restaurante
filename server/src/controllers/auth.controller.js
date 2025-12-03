import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createAccessToken } from '../lib/jwt.js';

const prisma = new PrismaClient();

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario
    const usuario = await prisma.usuario.findUnique({
      where: { email: email },
    });

    if (!usuario) return res.status(400).json({ message: "Usuario no encontrado" });

    // 2. Verificar contraseña
    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) return res.status(400).json({ message: "Contraseña incorrecta" });

    // 3. REGLA DE NEGOCIO: Validar Turno (Si no es Admin)
    if (usuario.rol !== 'ADMIN') {
      // Buscamos si hay AL MENOS UN turno abierto en el restaurante
      // (Asumimos que si hay un turno abierto, el restaurante está operando)
      const turnoAbierto = await prisma.turno.findFirst({
        where: { fechaFin: null } 
      });

      if (!turnoAbierto) {
        return res.status(403).json({ 
          message: "El restaurante está cerrado. Espera a que el Administrador abra el turno." 
        });
      }
    }

    // 4. Crear Token
    const token = await createAccessToken({ id: usuario.id, rol: usuario.rol });

    // 5. Responder al Frontend
    res.json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      token: token,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyToken = async (req, res) => {
    // Esto lo usaremos para validar sesión al recargar la página
    // Por ahora lo dejamos simple
    res.send('verify');
}