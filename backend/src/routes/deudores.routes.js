import {Router} from 'express';
import { 
    getDeudores, 
    getDeudorById, 
    updateDeudor, 
    deleteDeudor,
    addDeudor 
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

router.post('/agregar', authorizeRoles([isEmpleado,isAdmin,isJefe]),addDeudor);
router.get('/', authorizeRoles([isEmpleado,isAdmin,isJefe]),getDeudores);
router.get('/getbyid/:id', authorizeRoles([isEmpleado,isAdmin,isJefe]),getDeudorById);
router.put('/actualizar/:id', authorizeRoles([isEmpleado,isAdmin,isJefe]),updateDeudor);
router.delete('/eliminar/:id', authorizeRoles([isEmpleado,isAdmin,isJefe]),deleteDeudor);

export default router;