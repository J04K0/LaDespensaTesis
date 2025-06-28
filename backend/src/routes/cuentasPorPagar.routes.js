import { Router } from 'express';
import { 
  getCuentasPorPagar, 
  getCuentaPorPagarById, 
  createCuentaPorPagar, 
  updateCuentaPorPagar, 
  deleteCuentaPorPagar,
  marcarComoPagada,
  getCuentasPorCategoria,
  desmarcarComoPagada
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

router.get('/', authorizeRoles([isAdmin, isJefe]), getCuentasPorPagar);
router.get('/getbyid/:id', authorizeRoles([isAdmin, isJefe]), getCuentaPorPagarById);
router.get('/categoria/:categoria', authorizeRoles([isAdmin, isJefe]), getCuentasPorCategoria);
router.post('/agregar', authorizeRoles([isAdmin, isJefe]), createCuentaPorPagar);
router.patch('/actualizar/:id', authorizeRoles([isAdmin, isJefe]), updateCuentaPorPagar);
router.delete('/eliminar/:id', authorizeRoles([isAdmin, isJefe]), deleteCuentaPorPagar);
router.patch('/pagar/:id', authorizeRoles([isAdmin, isJefe]), marcarComoPagada);
router.patch('/desmarcar/:id', authorizeRoles([isAdmin, isJefe]), desmarcarComoPagada);

export default router;