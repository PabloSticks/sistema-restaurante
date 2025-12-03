import { Router } from 'express';
import { getTurnoActual, abrirTurno, cerrarTurno } from '../controllers/turno.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Todo protegido para Admin
router.use(verifyToken, verifyAdmin);

router.get('/', getTurnoActual);
router.post('/abrir', abrirTurno);
router.post('/cerrar', cerrarTurno);

export default router;