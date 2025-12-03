import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// OBTENER PRODUCTOS
export const getProductos = async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { categoria: 'asc' } // Ordenados por categoría para verlos mejor
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREAR PRODUCTO
export const createProducto = async (req, res) => {
  const { nombre, precio, categoria, estacion } = req.body;

  try {
    const newProducto = await prisma.producto.create({
      data: {
        nombre,
        precio: parseFloat(precio), // Convertir String a Float
        categoria,
        estacion,
        disponible: true
      }
    });

    res.json({ message: "Producto creado", producto: newProducto });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ACTUALIZAR PRODUCTO
export const updateProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria, estacion, disponible } = req.body;

  try {
    const updatedProducto = await prisma.producto.update({
      where: { id: Number(id) },
      data: {
        nombre,
        precio: parseFloat(precio),
        categoria,
        estacion,
        disponible: Boolean(disponible) // Asegurar booleano
      }
    });
    res.json({ message: "Producto actualizado", producto: updatedProducto });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ELIMINAR PRODUCTO
export const deleteProducto = async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.producto.delete({
      where: { id: Number(id) }
    });
    res.json({ message: "Producto eliminado" });
  } catch (error) {
    // VALIDACIÓN AUTOMÁTICA DE PRISMA
    if (error.code === 'P2003') {
        return res.status(400).json({ 
            message: "No se puede eliminar este plato porque ya ha sido vendido en pedidos anteriores. Mejor márcalo como 'No Disponible' (Edítalo)." 
        });
    }
    res.status(500).json({ message: error.message });
  }
};