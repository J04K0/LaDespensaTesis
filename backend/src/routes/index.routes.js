import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './products.routes.js';
import fileRoutes from './file.routes.js';
import deudoresRoutes from './deudores.routes.js';
import proveedoresRoutes from './proveedores.routes.js';
import cuentasPorPagarRoutes from './cuentasPorPagar.routes.js';
import ventaRoutes from './venta.routes.js';
import { emitStockBajoAlert } from '../services/alert.service.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/files', fileRoutes);
router.use('/deudores', deudoresRoutes);
router.use('/proveedores', proveedoresRoutes);
router.use('/cuentasPorPagar', cuentasPorPagarRoutes);
router.use('/ventas', ventaRoutes);

export default router;
