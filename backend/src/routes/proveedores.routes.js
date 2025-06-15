import { Router } from 'express';
import { 
  getProveedores, 
  getProveedorById, 
  createProveedor, 
  updateProveedor, 
  deleteProveedor,
  getProductosProveedor,
  vincularProductos,
  cambiarEstadoProveedor
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

// Agregar estos nuevos endpoints
router.get('/productos/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProductosProveedor);
router.patch('/vincular-productos/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), vincularProductos);
router.patch('/cambiar-estado/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), cambiarEstadoProveedor);

export default router;