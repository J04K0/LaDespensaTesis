import { Router } from 'express';
import { 
  getCuentasPorPagar, 
  getCuentaPorPagarById, 
  createCuentaPorPagar, 
  updateCuentaPorPagar, 
  deleteCuentaPorPagar,
  marcarComoPagada,
  getCuentasPorCategoria
} from '../controllers/cuentasPorPagar.controller.js';

import { 
  isAdmin, 
  isEmpleado, 
  authorizeRoles, 
  isJefe 
} from '../middlewares/authorization.middleware.js';

import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticationMiddleware);

router.get('/', authorizeRoles([isEmpleado, isAdmin, isJefe]), getCuentasPorPagar);
router.get('/getbyid/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), getCuentaPorPagarById);
router.get('/categoria/:categoria', authorizeRoles([isEmpleado, isAdmin, isJefe]), getCuentasPorCategoria);
router.post('/agregar', authorizeRoles([isAdmin, isJefe]), createCuentaPorPagar);
router.patch('/actualizar/:id', authorizeRoles([isAdmin, isJefe]), updateCuentaPorPagar);
router.delete('/eliminar/:id', authorizeRoles([isAdmin, isJefe]), deleteCuentaPorPagar);
router.patch('/pagar/:id', authorizeRoles([isAdmin, isJefe]), marcarComoPagada);

export default router;