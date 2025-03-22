import { Router } from 'express';
import { 
  getProveedores, 
  getProveedorById, 
  createProveedor, 
  updateProveedor, 
  deleteProveedor 
} from '../controllers/proveedor.controller.js';

import { 
  isAdmin, 
  isEmpleado, 
  authorizeRoles, 
  isJefe 
} from '../middlewares/authorization.middleware.js';

import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticationMiddleware);

router.post('/agregar', authorizeRoles([isEmpleado, isAdmin, isJefe]), createProveedor);
router.get('/', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProveedores);
router.get('/getbyid/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProveedorById);
router.patch('/actualizar/:id',authorizeRoles([isEmpleado, isAdmin, isJefe]), updateProveedor);
router.delete('/eliminar/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), deleteProveedor);

export default router;