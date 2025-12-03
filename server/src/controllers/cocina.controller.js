import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// OBTENER COLA DE COCINA (Solo platos no entregados)
export const getColaCocina = async (req, res) => {
  try {
    const items = await prisma.detallePedido.findMany({
      where: {
        producto: { estacion: { not: 'barra' } }, // Filtramos cosas de barra
        // OJO AQUÍ: Solo mostramos lo que NO ha sido retirado ni entregado
        estado: { notIn: ['ENTREGADO', 'RETIRADO', 'PAGADO'] } 
      },
      include: {
        producto: true,
        pedido: { include: { mesa: true } } // Para saber de qué mesa es
      },
      orderBy: { id: 'asc' } // Orden de llegada (FIFO)
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CAMBIAR ESTADO (El Chef toca el botón)
export const actualizarEstadoCocina = async (req, res) => {
  const { id } = req.params; // ID del detalle
  const { estado } = req.body; // 'EN_PREPARACION' o 'LISTO'

  try {
    const item = await prisma.detallePedido.update({
      where: { id: Number(id) },
      data: { estado },
      include: { 
        producto: true,
        // IMPORTANTE: Traemos el 'usuarioId' del pedido para saber quién es el garzón
        pedido: { include: { mesa: true } } 
      }
    });

    // --- NOTIFICACIONES DIRIGIDAS ---
    
    if (estado === 'LISTO') {
      const garzonId = item.pedido.usuarioId; // <--- EL DUEÑO DEL PEDIDO
      
      // ENVIAR SOLO AL GARZÓN ESPECÍFICO
      req.io.to(`user_${garzonId}`).emit('pedido:listo', {
        mesa: item.pedido.mesa.numero,
        producto: item.producto.nombre
      });
    }

    // Avisar a todos para refrescar listas (esto sí puede ser broadcast para que se vea en todas las pantallas de cocina y admins)
    req.io.emit('pedido:actualizado', { mesaId: item.pedido.mesaId });
    req.io.emit('cocina:actualizado'); 

    res.json(item);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};