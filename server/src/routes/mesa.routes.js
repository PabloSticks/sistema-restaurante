import { Router } from 'express';
import { 
  getMesas, 
  createMesa, 
  updateMesa, 
  deleteMesa, 
  ocuparMesa,  
  getMisMesas,
  liberarMesa
} from '../controllers/mesa.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// 1. Todos necesitan token (Garzones y Admins)
router.use(verifyToken);

// 2. Rutas comunes (Garzón y Admin)
router.get('/', getMesas); // Ver mapa del restaurante
router.get('/mis-mesas', getMisMesas); // Ver mis asignaciones
router.post('/:id/ocupar', ocuparMesa); // Tomar una mesa
router.post('/:id/liberar', liberarMesa); // Liberar mesa

// 3. Rutas SOLO Admin 
router.post('/', verifyAdmin, createMesa);
router.put('/:id', verifyAdmin, updateMesa);
router.delete('/:id', verifyAdmin, deleteMesa);

export default router;