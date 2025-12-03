import { Router } from 'express';
import { getPedidoMesa, agregarItems, cambiarEstadoDetalle, pagarCuenta } from '../controllers/pedido.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get('/mesa/:mesaId', getPedidoMesa);
router.post('/mesa/:mesaId', agregarItems);

// Rutas de flujo
router.post('/detalle/:detalleId/estado', cambiarEstadoDetalle); // Usaremos esta para RETIRAR y ENTREGAR
router.post('/mesa/:mesaId/pagar', pagarCuenta); // COBRAR

export default router;