import express from 'express';
import  authController  from '../controllers/auth.controller.js';
const router = express.Router();

// Define tus rutas aquí
// Ejemplo de ruta de autenticación
router.post('/login', authController.login);

export default router;
