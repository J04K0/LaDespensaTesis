import express from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import productRoutes from './products.routes.js';
import fileRoutes from './file.routes.js';
import deudoresRoutes from './deudores.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/files', fileRoutes);

router.use('/products', productRoutes);

router.use('/deudores', deudoresRoutes);
export default router;
