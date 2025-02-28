import express from 'express';
import { 
    getProducts, 
    getProductById, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    getProductsByCategory,
    verificarStock,
    getProductsExpiringSoon,
    getExpiredProducts,
    scanProducts,
    actualizarStockVenta
} from "../controllers/products.controller.js";

import { 
    isAdmin, 
    isEmpleado, 
    authorizeRoles, 
    isJefe 
} from '../middlewares/authorization.middleware.js';

import authenticationMiddleware from "../middlewares/authentication.middleware.js";

const router = express.Router();
router.use(authenticationMiddleware);

router.post('/agregar', authorizeRoles([isEmpleado, isAdmin, isJefe]), addProduct);
router.get('/', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProducts);
router.get('/getbyid/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProductById);
router.get('/getbycategory/:categoria', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProductsByCategory);
router.get('/verificarstock', authorizeRoles([isEmpleado, isAdmin, isJefe]), verificarStock);
router.get('/expiringsoon', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProductsExpiringSoon);
router.get('/expired', authorizeRoles([isEmpleado, isAdmin, isJefe]), getExpiredProducts);
router.patch('/actualizar/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), updateProduct);
router.delete('/eliminar/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), deleteProduct);
router.post('/scan', authorizeRoles([isEmpleado, isAdmin, isJefe]), scanProducts);
router.post('/actualizar-stock-venta', authorizeRoles([isEmpleado, isAdmin, isJefe]), actualizarStockVenta);


export default router;
