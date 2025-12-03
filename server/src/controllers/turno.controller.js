import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. OBTENER ESTADO ACTUAL
export const getTurnoActual = async (req, res) => {
  try {
    // Buscamos si existe algun turno que NO tenga fecha de fin (o sea, sigue abierto)
    const turnoAbierto = await prisma.turno.findFirst({
      where: { fechaFin: null },
      include: { usuario: true } // Traemos info de quién lo abrió
    });

    if (turnoAbierto) {
      res.json({ estado: 'abierto', turno: turnoAbierto });
    } else {
      res.json({ estado: 'cerrado', turno: null });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. ABRIR TURNO
export const abrirTurno = async (req, res) => {
  const { userId } = req.body; // El ID del admin que abre

  try {
    // Validar que no haya uno abierto ya
    const turnoAbierto = await prisma.turno.findFirst({ where: { fechaFin: null } });
    if (turnoAbierto) return res.status(400).json({ message: "Ya hay un turno abierto." });

    // Crear nuevo turno
    const nuevoTurno = await prisma.turno.create({
      data: {
        usuarioId: userId,
        fechaInicio: new Date(),
        totalVentas: 0
      }
    });

    res.json({ message: "Turno abierto exitosamente", turno: nuevoTurno });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. CERRAR TURNO
export const cerrarTurno = async (req, res) => {
  try {
    const turnoAbierto = await prisma.turno.findFirst({ where: { fechaFin: null } });
    if (!turnoAbierto) return res.status(400).json({ message: "No hay turno para cerrar." });

    // 1. Cerramos el turno 
    const turnoCerrado = await prisma.turno.update({
      where: { id: turnoAbierto.id },
      data: { fechaFin: new Date() }
    });

    // 2.Liberamos TODAS las mesas del restaurante
    // updateMany actualiza varios registros de una sola vez
    await prisma.mesa.updateMany({
      data: {
        estado: 'libre',
        usuarioId: null // Quitamos al garzón asignado
      }
    });

    res.json({ 
      message: "Turno cerrado y todas las mesas han sido liberadas.", 
      turno: turnoCerrado 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};