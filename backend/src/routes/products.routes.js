import express from 'express';
import { getProducts, getProductById, addProduct, updateProduct, deleteProduct,getProductsByCategory,verificarStock } from "../controllers/products.controller.js";
import { isAdmin, isEmpleado, authorizeRoles, isJefe } from '../middlewares/authorization.middleware.js';
import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const router = express.Router();
router.use(authenticationMiddleware);

router.get('/', authorizeRoles([isEmpleado,isAdmin,isJefe]),getProducts);

router.get('/getbyid/:id', authorizeRoles([isEmpleado,isAdmin,isJefe]),getProductById);

router.post('/agregar', authorizeRoles([isEmpleado,isAdmin,isJefe]),addProduct);

router.patch('/actualizar/:id', authorizeRoles([isEmpleado,isAdmin,isJefe]),updateProduct);

router.delete('/eliminar/:id', authorizeRoles([isEmpleado,isAdmin,isJefe]),deleteProduct);

router.get('/getbycategory/:categoria', authorizeRoles([isEmpleado,isAdmin,isJefe]),getProductsByCategory);

router.get('/verificarstock', authorizeRoles([isEmpleado,isAdmin,isJefe]),verificarStock);

export default router;
