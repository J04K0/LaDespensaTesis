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

// Restringir todas las rutas de proveedores solo para admin y jefe
router.post('/agregar', authorizeRoles([isAdmin, isJefe]), createProveedor);
router.get('/', authorizeRoles([isAdmin, isJefe]), getProveedores);
router.get('/getbyid/:id', authorizeRoles([isAdmin, isJefe]), getProveedorById);
router.patch('/actualizar/:id',authorizeRoles([isAdmin, isJefe]), updateProveedor);
router.delete('/eliminar/:id', authorizeRoles([isAdmin, isJefe]), deleteProveedor);

// Agregar estos nuevos endpoints
router.get('/productos/:id', authorizeRoles([isAdmin, isJefe]), getProductosProveedor);
router.patch('/vincular-productos/:id', authorizeRoles([isAdmin, isJefe]), vincularProductos);
router.patch('/cambiar-estado/:id', authorizeRoles([isAdmin, isJefe]), cambiarEstadoProveedor);

export default router;