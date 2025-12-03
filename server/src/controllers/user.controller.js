import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';


const prisma = new PrismaClient();

// OBTENER TODOS LOS USUARIOS
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.usuario.findMany({
      // Tip de Ingeniero: NUNCA devuelvas el campo 'password', ni siquiera encriptado.
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      },
      orderBy: { id: 'asc' }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREAR NUEVO USUARIO
export const createUser = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    // 1. Validar duplicados
    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ message: "El email ya está registrado" });

    // 2. Encriptar contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Guardar
    const newUser = await prisma.usuario.create({
      data: {
        nombre,
        email,
        password: passwordHash,
        rol,
      }
    });

    res.json({ message: "Usuario creado correctamente", user: newUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ACTUALIZAR USUARIO (PUT)
export const updateUser = async (req, res) => {
  const { id } = req.params; // El ID viene en la URL
  const { nombre, email, password, rol, activo } = req.body;

  try {
    let dataToUpdate = { nombre, email, rol, activo };

    // Si envían password, hay que encriptarla de nuevo. Si no, no se toca.
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.usuario.update({
      where: { id: Number(id) },
      data: dataToUpdate
    });

    res.json({ message: "Usuario actualizado", user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ELIMINAR USUARIO (DELETE)
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = Number(id);

    // 1. VALIDACIÓN: ¿Tiene turno abierto?
    const turnoAbierto = await prisma.turno.findFirst({
      where: { usuarioId: userId, fechaFin: null }
    });

    if (turnoAbierto) {
      return res.status(400).json({ 
        message: "No puedes eliminar a este usuario: Tiene el TURNO ABIERTO. Debe cerrar caja primero." 
      });
    }

    // 2. VALIDACIÓN: ¿Tiene mesas a su cargo ahora mismo?
    const mesasActivas = await prisma.mesa.findFirst({
      where: { usuarioId: userId, estado: 'ocupada' }
    });

    if (mesasActivas) {
      return res.status(400).json({ 
        message: "No puedes eliminar: El usuario está atendiendo mesas activas." 
      });
    }

    // 3. Borrar
    await prisma.usuario.delete({
      where: { id: userId }
    });

    res.json({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    // Error P2003: Foreign Key Constraint (Tiene historial de pedidos o turnos cerrados)
    if (error.code === 'P2003') {
        // En lugar de borrar, sugerimos desactivar
        return res.status(400).json({ 
            message: "No se puede eliminar porque tiene historial de ventas. Te sugerimos cambiar su estado a INACTIVO." 
        });
    }
    res.status(500).json({ message: error.message });
  }
};