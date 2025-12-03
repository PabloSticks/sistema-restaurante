import { Router } from 'express';
import { getColaCocina, actualizarEstadoCocina } from '../controllers/cocina.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Solo usuarios logueados pueden entrar a cocina
router.use(verifyToken);

router.get('/cola', getColaCocina);           // Ver qué hay que cocinar
router.post('/:id/estado', actualizarEstadoCocina); // Cambiar estado (Cocinando/Listo)

export default router;