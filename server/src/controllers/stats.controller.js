import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const getDashboardStats = async (req, res) => {
  try {
    // 1. VENTAS DEL DÍA
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const ventasHoy = await prisma.pedido.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        estado: 'PAGADO', 
        fechaTermino: { gte: startOfDay }
      }
    });

    // 2. ESTADO MESAS
    const totalMesas = await prisma.mesa.count();
    const mesasOcupadas = await prisma.mesa.count({ where: { estado: 'ocupada' } });

    // 3. CARGA COCINA
    const cocinaPendientes = await prisma.detallePedido.count({
      where: { 
        estado: { in: ['PENDIENTE', 'EN_PREPARACION'] },
        producto: { estacion: { not: 'barra' } }
      }
    });

    // 4. ESTADÍSTICAS POR CATEGORÍA
    // A. Obtenemos cuánto se vendió de cada ID de producto
    const ventasPorProducto = await prisma.detallePedido.groupBy({
      by: ['productoId'],
      _sum: { cantidad: true }
    });

    // Mapa auxiliar
    const salesMap = {};
    ventasPorProducto.forEach(v => {
      salesMap[v.productoId] = v._sum.cantidad;
    });

    // B. Traemos productos
    const productos = await prisma.producto.findMany();

    // C. Estructura de respuesta
    const statsPorCategoria = {
      global: [],
      bebida: [],
      plato_fondo: [],
      entrada: [],
      postre: []
    };

    // D. Clasificar
    productos.forEach(p => {
      const cantidad = salesMap[p.id] || 0;
      if (cantidad > 0) { 
        const dataPoint = { name: p.nombre, ventas: cantidad };
        
        statsPorCategoria.global.push(dataPoint);
        
        // Agregar a su categoría si existe en nuestro objeto
        if (statsPorCategoria[p.categoria]) {
          statsPorCategoria[p.categoria].push(dataPoint);
        }
      }
    });

    // E. Ordenar y Top 5
    Object.keys(statsPorCategoria).forEach(key => {
      statsPorCategoria[key].sort((a, b) => b.ventas - a.ventas);
      statsPorCategoria[key] = statsPorCategoria[key].slice(0, 5);
    });

    res.json({
      ventasTotal: ventasHoy._sum.total || 0,
      pedidosCount: ventasHoy._count.id || 0,
      mesas: { total: totalMesas, ocupadas: mesasOcupadas },
      cocinaPendientes,
      graficos: statsPorCategoria // Envia el objeto clasificado
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};