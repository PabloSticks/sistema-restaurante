import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// OBTENER MESAS
export const getMesas = async (req, res) => {
  try {
    // Las ordenamos por número para que salgan ordenadas (M-1, M-2...)
    const mesas = await prisma.mesa.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(mesas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREAR MESA
export const createMesa = async (req, res) => {
  const { numero, capacidad } = req.body;

  try {
    // 1. Validar duplicado
    const existe = await prisma.mesa.findUnique({ 
      where: { numero: numero } 
    });
    
    if (existe) {
      return res.status(400).json({ message: "Ya existe una mesa con este número" });
    }

    // 2. Crear
    const newMesa = await prisma.mesa.create({
      data: {
        numero,
        capacidad: parseInt(capacidad), // Aseguramos que sea número
        estado: 'libre' // Siempre nacen libres
      }
    });

    res.json({ message: "Mesa creada", mesa: newMesa });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ACTUALIZAR MESA
export const updateMesa = async (req, res) => {
  const { id } = req.params;
  const { numero, capacidad } = req.body;

  try {
    const updatedMesa = await prisma.mesa.update({
      where: { id: Number(id) },
      data: {
        numero,
        capacidad: parseInt(capacidad)
      }
    });
    res.json({ message: "Mesa actualizada", mesa: updatedMesa });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ELIMINAR MESA
export const deleteMesa = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Buscamos la mesa y sus pedidos pendientes
    const mesa = await prisma.mesa.findUnique({
      where: { id: Number(id) },
      include: { 
        pedidos: {
          where: { estado: { not: 'ENTREGADO' } } // Ojo: Ajusta esto según tu lógica final de cierre
        }
      }
    });

    if (!mesa) return res.status(404).json({ message: "Mesa no encontrada" });

    // 2. VALIDACIÓN: ¿Está ocupada?
    if (mesa.estado !== 'libre') {
      return res.status(400).json({ 
        message: `No se puede eliminar: La mesa está OCUPADA por ${mesa.usuarioId ? 'un garzón' : 'alguien'}.` 
      });
    }

    // 3. VALIDACIÓN: ¿Tiene pedidos activos?
    if (mesa.pedidos.length > 0) {
      return res.status(400).json({ 
        message: "No se puede eliminar: La mesa tiene pedidos pendientes de cobro." 
      });
    }

    // 4. Si pasa todo, borramos
    await prisma.mesa.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Mesa eliminada correctamente" });
  } catch (error) {
    // Capturamos error de llave foránea (por si tiene historial antiguo)
    if (error.code === 'P2003') {
       return res.status(400).json({ message: "No se puede eliminar: Esta mesa tiene historial de ventas antiguas." });
    }
    res.status(500).json({ message: error.message });
  }
};

// OCUPAR MESA
export const ocuparMesa = async (req, res) => {
  const { id } = req.params; // ID de la mesa
  const userId = req.user.id; // ID del garzón (viene del token)

  try {
    const mesa = await prisma.mesa.findUnique({ where: { id: Number(id) } });

    if (mesa.estado !== 'libre') {
      return res.status(400).json({ message: "La mesa ya está ocupada por otro compañero." });
    }

    const mesaOcupada = await prisma.mesa.update({
      where: { id: Number(id) },
      data: {
        estado: 'ocupada',
        usuarioId: userId // <-- Aquí la asignamos
      }
    });

    res.json({ message: "Mesa asignada a tus pendientes", mesa: mesaOcupada });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ver solo MIS mesas 
export const getMisMesas = async (req, res) => {
  const userId = req.user.id;

  try {
    const misMesas = await prisma.mesa.findMany({
      where: { 
        usuarioId: userId,
        estado: 'ocupada' 
      },
      include: {
        // CORRECCIÓN: Filtramos pedidos que NO estén PAGADOS
        pedidos: { 
           where: { estado: { not: 'PAGADO' } },
           include: { detalles: true } // Traemos los detalles para contar cuántos platos hay
        }
      }
    });
    res.json(misMesas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Liberar mesa 
export const liberarMesa = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // 1. Buscamos la mesa y sus pedidos
    const mesa = await prisma.mesa.findUnique({
      where: { id: Number(id) },
      include: { pedidos: true }
    });

    if (!mesa) return res.status(404).json({ message: "Mesa no encontrada" });

    // 2. Validar que la mesa sea del garzón que intenta liberarla (o Admin)
    if (mesa.usuarioId !== userId && req.user.rol !== 'ADMIN') {
      return res.status(403).json({ message: "No puedes liberar una mesa que no es tuya." });
    }

    // 3.  Verificar pedidos activos
    // Consideramos "Activo" cualquier pedido que NO esté 'ENTREGADO' o 'PAGADO'
    const pedidosPendientes = mesa.pedidos.filter(p => p.estado !== 'ENTREGADO');

    if (pedidosPendientes.length > 0) {
      return res.status(400).json({ 
        message: "No puedes liberar la mesa: Tiene pedidos pendientes de entrega/pago." 
      });
    }

    // 4. Liberar
    const mesaLiberada = await prisma.mesa.update({
      where: { id: Number(id) },
      data: {
        estado: 'libre',
        usuarioId: null
      }
    });

    res.json({ message: "Mesa liberada exitosamente", mesa: mesaLiberada });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};