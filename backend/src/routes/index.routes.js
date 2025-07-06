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

// Endpoint temporal para probar notificaciones - ELIMINAR EN PRODUCCIÓN
router.post('/test-notification', (req, res) => {
  try {
    const testProduct = {
      _id: 'test123',
      Nombre: 'Producto de Prueba',
      Stock: 2,
      Categoria: 'Test'
    };
    
    console.log('🧪 Enviando notificación de prueba...');
    emitStockBajoAlert(testProduct);
    
    res.json({ 
      success: true, 
      message: 'Notificación de prueba enviada',
      product: testProduct
    });
  } catch (error) {
    console.error('Error enviando notificación de prueba:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error enviando notificación de prueba',
      error: error.message
    });
  }
});

export default router;
