import {Router} from 'express';
import { getDeudores,getDeudorById,updateDeudor,deleteDeudor,addDeudor } from '../controllers/deudores.controller.js';
import { isAdmin,isEmpleado,authorizeRoles, isJefe } from '../middlewares/authorization.middleware.js';
import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const router = Router();
router.use(authenticationMiddleware);
// Define tus rutas aquí
// Ejemplo de ruta de deudores
router.get('/', authorizeRoles([isEmpleado,isAdmin,isJefe]),getDeudores);

router.get('/getbyid/:id', authorizeRoles([isEmpleado,isAdmin,isJefe]),getDeudorById);

router.put('/actualizar/:id', authorizeRoles([isEmpleado,isAdmin,isJefe]),updateDeudor);

router.delete('/eliminar/:id', authorizeRoles([isEmpleado,isAdmin,isJefe]),deleteDeudor);

router.post('/agregar', authorizeRoles([isEmpleado,isAdmin,isJefe]),addDeudor);

export default router;