import { Router } from 'express';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../controllers/producto.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// 1. Middleware Global: Tienes que estar logueado (Tener Token)
router.use(verifyToken); 

// 2. Rutas Públicas (para Garzones, Cocina, Admin)
// CUALQUIER empleado puede ver el menú
router.get('/', getProductos);

// 3. Rutas Protegidas (SOLO ADMIN)
// Solo el jefe puede cambiar el menú
router.post('/', verifyAdmin, createProducto);
router.put('/:id', verifyAdmin, updateProducto);
router.delete('/:id', verifyAdmin, deleteProducto);

export default router;