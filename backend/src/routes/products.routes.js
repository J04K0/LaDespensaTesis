import express from 'express';
import { getProducts, getProductById, addProduct, updateProduct, deleteProduct } from "../controllers/products.controller.js";

const router = express.Router();

router.get('/', getProducts);

router.get('/getbyid/:id', getProductById);

router.post('/agregar', addProduct);

router.put('/actualizar/:id', updateProduct);

router.delete('/eliminar/:id', deleteProduct);

export default router;
