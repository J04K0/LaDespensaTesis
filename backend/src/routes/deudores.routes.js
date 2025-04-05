import { Router } from 'express';
import { 
    getDeudores, 
    getDeudorById, 
    updateDeudor, 
    deleteDeudor,
    addDeudor,
    updateDeudorPagos
} from '../controllers/deudores.controller.js';

import { 
    isAdmin, 
    isEmpleado, 
    authorizeRoles, 
    isJefe 
} from '../middlewares/authorization.middleware.js';

import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticationMiddleware);

router.post('/agregar', authorizeRoles([isEmpleado, isAdmin, isJefe]), addDeudor);
router.get('/', authorizeRoles([isEmpleado, isAdmin, isJefe]), getDeudores);
router.get('/getbyid/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), getDeudorById);
router.patch('/actualizar/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), updateDeudor); // Cambiado a PATCH
router.delete('/eliminar/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), deleteDeudor);
router.put('/:id/pagos', authorizeRoles([isEmpleado, isAdmin, isJefe]), updateDeudorPagos);

export default router;
