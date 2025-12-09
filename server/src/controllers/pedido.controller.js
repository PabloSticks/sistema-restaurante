import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. OBTENER PEDIDO ACTUAL (CORREGIDO)
export const getPedidoMesa = async (req, res) => {
  const { mesaId } = req.params;

  try {
    const pedido = await prisma.pedido.findFirst({
      where: {
        mesaId: Number(mesaId),
        // AQUÍ ESTABA EL ERROR: Antes decía { not: 'ENTREGADO' }
        // AHORA: Buscamos cualquier pedido que NO esté PAGADO.
        estado: { not: 'PAGADO' } 
      },
      include: {
        detalles: {
          include: { producto: true },
          orderBy: { id: 'asc' } // Ordenar por orden de llegada
        }
      }
    });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. AGREGAR ITEMS (CORREGIDO)
export const agregarItems = async (req, res) => {
  const { mesaId } = req.params;
  const { items } = req.body; 
  const userId = req.user.id;

  try {
    const turno = await prisma.turno.findFirst({ where: { fechaFin: null } });
    if (!turno) return res.status(400).json({ message: "No hay turno abierto." });

    // Validamos que busquemos un pedido activo (NO PAGADO)
    let pedido = await prisma.pedido.findFirst({
      where: {
        mesaId: Number(mesaId),
        estado: { not: 'PAGADO' } 
      }
    });

    // Si no existe, creamos uno nuevo
    if (!pedido) {
      pedido = await prisma.pedido.create({
        data: {
          mesaId: Number(mesaId),
          usuarioId: userId,
          turnoId: turno.id,
          estado: 'PENDIENTE',
          total: 0
        }
      });
    }    let totalAgregado = 0;

    for (const item of items) {
      await prisma.detallePedido.create({
        data: {
          pedidoId: pedido.id,
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnit: item.precio,
          estado: 'PENDIENTE', // Nace pendiente
          // NUEVO: Guardamos el comentario (o null si no viene)
          comentario: item.comentario || null
        }
      });
      totalAgregado += (item.precio * item.cantidad);
    }

    // Actualizamos el total
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        total: { increment: totalAgregado },
        // Mantenemos el estado del pedido general en PENDIENTE hasta que se pague
        estado: 'PENDIENTE' 
      }
    });

    // NOTIFICACIONES
    req.io.emit('cocina:nuevo_pedido', { mesaId: mesaId, items });
    req.io.emit('pedido:actualizado', { mesaId });

    res.json({ message: "Pedido actualizado" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// 3. ENTREGAR O RETIRAR UN ITEM (SIN CAMBIOS, PERO INCLUIDO POR SI ACASO)
export const cambiarEstadoDetalle = async (req, res) => {
  const { detalleId } = req.params;
  const { estado } = req.body; 

  try {
    const item = await prisma.detallePedido.update({
      where: { id: Number(detalleId) },
      data: { estado },
      include: { pedido: true, producto: true }
    });

    // EVENTO GENERAL (Para refrescar mesas del garzón)
    req.io.emit('pedido:actualizado', { mesaId: item.pedido.mesaId });
    
    // --- LA SOLUCIÓN LIMPIA ---
    // Si el estado es RETIRADO, mandamos una orden quirúrgica a la cocina para que lo quite
    if (estado === 'RETIRADO') {
        req.io.emit('cocina:item_retirado', { id: item.id });
    } else {
        // Si es otro cambio, que refresquen la lista normal
        req.io.emit('cocina:actualizado'); 
    }

    res.json({ message: `Estado actualizado a ${estado}`, item });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. PAGAR CUENTA 
export const pagarCuenta = async (req, res) => {
  const { mesaId } = req.params;
  const { totalConPropina } = req.body; 

  try {
    const pedido = await prisma.pedido.findFirst({
      where: { mesaId: Number(mesaId), estado: { not: 'PAGADO' } }
    });

    if (!pedido) return res.status(404).json({ message: "No hay cuenta abierta" });

    // Marcar como PAGADO
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        estado: 'PAGADO', 
        fechaTermino: new Date(),
        total: parseFloat(totalConPropina)
      }
    });

    await prisma.mesa.update({
      where: { id: Number(mesaId) },
      data: { estado: 'libre', usuarioId: null }
    });

    req.io.emit('pedido:actualizado', { mesaId: Number(mesaId) });
    
    req.io.emit('mesas:actualizado'); 

    res.json({ message: "Cuenta pagada" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const entregarItem = cambiarEstadoDetalle; 

export const getHistorialVentas = async (req, res) => {
  try {
    const ventas = await prisma.pedido.findMany({
      where: {
        estado: 'PAGADO' 
      },
      include: {
        mesa: true,
        usuario: true, 
        turno: true,
        detalles: {
          include: { producto: true }
        }
      },
      orderBy: {
        fechaTermino: 'desc' 
      },
      take: 100 
    });
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};