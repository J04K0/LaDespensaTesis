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
    actualizarStockVenta,
    getProductByBarcode,
    getProductForCreation,
    getProductPriceHistory,
} from "../controllers/products.controller.js";

import { 
    isAdmin, 
    isEmpleado, 
    authorizeRoles, 
    isJefe 
} from '../middlewares/authorization.middleware.js';

import authenticationMiddleware from "../middlewares/authentication.middleware.js";
import { handleFileSizeLimit , upload } from "../middlewares/multer.middleware.js";

const router = express.Router();
router.use(authenticationMiddleware);

// Restringir agregar productos solo para admin y jefe
router.post('/agregar', upload.single('image'), handleFileSizeLimit,authorizeRoles([isAdmin, isJefe]), addProduct);
router.get('/', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProducts);
router.get('/getbyid/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProductById);
router.get('/getbycategory/:categoria', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProductsByCategory);
router.get('/verificarstock', authorizeRoles([isEmpleado, isAdmin, isJefe]), verificarStock);
router.get('/expiringsoon', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProductsExpiringSoon);
router.get('/expired', authorizeRoles([isEmpleado, isAdmin, isJefe]), getExpiredProducts);
router.get('/getbybarcode/:codigoBarras', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProductByBarcode)
router.get('/getbybarcodecreate/:codigoBarras', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProductForCreation);
router.get('/historial-precios/:id', authorizeRoles([isEmpleado, isAdmin, isJefe]), getProductPriceHistory);

router.patch('/actualizar/:id', upload.single('image'), handleFileSizeLimit, authorizeRoles([isAdmin, isJefe]), updateProduct);
router.delete('/eliminar/:id', authorizeRoles([isAdmin, isJefe]), deleteProduct);
router.post('/scan', authorizeRoles([isEmpleado, isAdmin, isJefe]), scanProducts);
router.post('/actualizar-stock-venta', authorizeRoles([isEmpleado, isAdmin, isJefe]), actualizarStockVenta);

export default router;
