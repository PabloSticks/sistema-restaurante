import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';
import { verifyToken, verifyAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

// Protegemos TODAS las rutas: Requieren Token y ser ADMIN
router.use(verifyToken, verifyAdmin);

// Rutas
router.get('/', getUsers);         // Ver lista
router.post('/', createUser);      // Crear
router.put('/:id', updateUser);    // Editar (Update)
router.delete('/:id', deleteUser); // Borrar (Delete)

export default router;